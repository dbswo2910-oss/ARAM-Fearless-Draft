package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
	"time"
)

type ActiveInstall struct {
	Schema             int    `json:"schema"`
	UpdatedAt          string `json:"updatedAt"`
	Version            string `json:"version"`
	AppDir             string `json:"appDir"`
	Main               string `json:"main"`
	MainSHA256         string `json:"mainSha256"`
	LauncherVersion    string `json:"launcherVersion"`
	LauncherExecutable string `json:"launcherExecutable"`
	LauncherSHA256     string `json:"launcherSha256"`
}

type ShortcutInfo struct {
	ShortcutPath string `json:"shortcutPath"`
	TargetPath   string `json:"targetPath"`
	Arguments    string `json:"arguments,omitempty"`
}

type ShortcutRepair struct {
	ShortcutPath string `json:"shortcutPath"`
	Previous     string `json:"previous"`
	Current      string `json:"current"`
	Repaired     bool   `json:"repaired"`
	Error        string `json:"error,omitempty"`
}

type BootJournalRecord struct {
	Schema                 int              `json:"schema"`
	At                     string           `json:"at"`
	ProcessKind            string           `json:"processKind"`
	PID                    int              `json:"pid"`
	BootID                 string           `json:"bootId"`
	Executable             string           `json:"executable"`
	ExecutableSHA256       string           `json:"executableSha256"`
	ExecutableModifiedTime string           `json:"executableModifiedTime"`
	CWD                    string           `json:"cwd"`
	AppVersion             string           `json:"appVersion"`
	RuntimeVersion         string           `json:"runtimeVersion"`
	InstalledVersion       string           `json:"installedVersion"`
	ActiveVersion          string           `json:"activeVersion"`
	BootTarget             string           `json:"bootTarget"`
	LaunchSource           string           `json:"launchSource"`
	LastKnownGood          string           `json:"lastKnownGood"`
	PendingUpdate          string           `json:"pendingUpdate"`
	RelaunchTarget         string           `json:"relaunchTarget"`
	RollbackReason         string           `json:"rollbackReason"`
	ResourcesAppAsar       string           `json:"resourcesAppAsar"`
	CanonicalLauncher      string           `json:"canonicalLauncher"`
	Shortcuts              []ShortcutInfo   `json:"shortcuts,omitempty"`
	ShortcutRepairs        []ShortcutRepair `json:"shortcutRepairs,omitempty"`
	DuplicateExecutables   []string         `json:"duplicateExecutables,omitempty"`
	Note                   string           `json:"note,omitempty"`
}

func canonicalRoot(local string) string {
	return filepath.Join(local, "ARAM Fearless Draft AutoUpdate")
}

func canonicalLauncherPath(local string) string {
	return filepath.Join(canonicalRoot(local), "launcher", "ARAM_Fearless_Draft_Launcher_windows_x64.exe")
}

func activeInstallPath(local string) string {
	return filepath.Join(canonicalRoot(local), "active-install.json")
}

func bootDiagnosticDir(local string) string {
	return filepath.Join(canonicalRoot(local), "boot-diagnostics")
}

func fileModifiedTime(p string) string {
	st, err := os.Stat(p)
	if err != nil {
		return ""
	}
	return st.ModTime().UTC().Format(time.RFC3339Nano)
}

func writeJSONAtomic(p string, v any) error {
	if err := os.MkdirAll(filepath.Dir(p), 0755); err != nil {
		return err
	}
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return err
	}
	b = append(b, '\n')
	tmp := fmt.Sprintf("%s.tmp-%d", p, time.Now().UnixNano())
	if err := os.WriteFile(tmp, b, 0644); err != nil {
		return err
	}
	_ = os.Remove(p)
	if err := os.Rename(tmp, p); err != nil {
		_ = os.Remove(tmp)
		return err
	}
	return nil
}

func readActiveInstall(local string) *ActiveInstall {
	b, err := os.ReadFile(activeInstallPath(local))
	if err != nil {
		return nil
	}
	var a ActiveInstall
	if json.Unmarshal(b, &a) != nil {
		return nil
	}
	return &a
}

func writeActiveInstall(local, self string, selected AppCandidate) error {
	a := ActiveInstall{
		Schema:             1,
		UpdatedAt:          time.Now().UTC().Format(time.RFC3339Nano),
		Version:            selected.Version,
		AppDir:             selected.AppDir,
		Main:               selected.Main,
		MainSHA256:         selected.MainSHA256,
		LauncherVersion:    launcherVersion,
		LauncherExecutable: self,
		LauncherSHA256:     fileSHA256(self),
	}
	return writeJSONAtomic(activeInstallPath(local), a)
}

func copyFileAtomic(src, dst string) error {
	if strings.EqualFold(filepath.Clean(src), filepath.Clean(dst)) {
		return nil
	}
	if fileSHA256(src) != "" && strings.EqualFold(fileSHA256(src), fileSHA256(dst)) {
		return nil
	}
	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return err
	}
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	tmp := fmt.Sprintf("%s.tmp-%d", dst, time.Now().UnixNano())
	out, err := os.OpenFile(tmp, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0755)
	if err != nil {
		return err
	}
	_, cpErr := io.Copy(out, in)
	closeErr := out.Close()
	if cpErr != nil {
		_ = os.Remove(tmp)
		return cpErr
	}
	if closeErr != nil {
		_ = os.Remove(tmp)
		return closeErr
	}
	if fileSHA256(src) == "" || !strings.EqualFold(fileSHA256(src), fileSHA256(tmp)) {
		_ = os.Remove(tmp)
		return fmt.Errorf("canonical launcher copy hash mismatch")
	}
	_ = os.Remove(dst)
	if err := os.Rename(tmp, dst); err != nil {
		_ = os.Remove(tmp)
		return err
	}
	return nil
}

func ensureCanonicalLauncher(local, self string) (string, error) {
	dst := canonicalLauncherPath(local)
	if err := copyFileAtomic(self, dst); err != nil {
		return dst, err
	}
	return dst, nil
}

func psLiteral(s string) string {
	return "'" + strings.ReplaceAll(s, "'", "''") + "'"
}

func scanShortcutsWindows() []ShortcutInfo {
	if runtime.GOOS != "windows" {
		return nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	script := `$ErrorActionPreference='SilentlyContinue'; $w=New-Object -ComObject WScript.Shell; $roots=@([Environment]::GetFolderPath('Desktop'),[Environment]::GetFolderPath('StartMenu'),[Environment]::GetFolderPath('CommonStartMenu')); $out=@(); foreach($r in $roots){if(!$r){continue}; Get-ChildItem -LiteralPath $r -Filter *.lnk -Recurse -ErrorAction SilentlyContinue | ForEach-Object {$s=$w.CreateShortcut($_.FullName); if(($s.TargetPath -match '(?i)aram') -and ($s.TargetPath -match '(?i)fearless')){$out += [PSCustomObject]@{shortcutPath=$_.FullName;targetPath=$s.TargetPath;arguments=$s.Arguments}}}}; $out | ConvertTo-Json -Compress`
	b, err := exec.CommandContext(ctx, "powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script).Output()
	if err != nil || len(strings.TrimSpace(string(b))) == 0 {
		return nil
	}
	var out []ShortcutInfo
	if json.Unmarshal(b, &out) == nil {
		return out
	}
	var one ShortcutInfo
	if json.Unmarshal(b, &one) == nil && one.ShortcutPath != "" {
		return []ShortcutInfo{one}
	}
	return nil
}

func looksLikeProductShortcut(s ShortcutInfo) bool {
	a := strings.ToLower(s.ShortcutPath + " " + s.TargetPath)
	return strings.Contains(a, "aram") && strings.Contains(a, "fearless") && strings.Contains(a, "draft")
}

func repairProductShortcuts(shortcuts []ShortcutInfo, canonical string) []ShortcutRepair {
	if runtime.GOOS != "windows" || canonical == "" {
		return nil
	}
	var out []ShortcutRepair
	for _, s := range shortcuts {
		if !looksLikeProductShortcut(s) || strings.EqualFold(filepath.Clean(s.TargetPath), filepath.Clean(canonical)) {
			continue
		}
		r := ShortcutRepair{ShortcutPath: s.ShortcutPath, Previous: s.TargetPath, Current: canonical}
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		script := fmt.Sprintf(`$w=New-Object -ComObject WScript.Shell; $s=$w.CreateShortcut(%s); $s.TargetPath=%s; $s.WorkingDirectory=%s; $s.Save()`, psLiteral(s.ShortcutPath), psLiteral(canonical), psLiteral(filepath.Dir(canonical)))
		err := exec.CommandContext(ctx, "powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script).Run()
		cancel()
		if err != nil {
			r.Error = err.Error()
		} else {
			r.Repaired = true
		}
		out = append(out, r)
	}
	return out
}

func scanKnownLauncherExecutables(local, self string) []string {
	roots := []string{filepath.Dir(self), filepath.Join(local, "Programs"), filepath.Join(os.Getenv("USERPROFILE"), "Desktop"), filepath.Join(os.Getenv("USERPROFILE"), "Downloads"), canonicalRoot(local)}
	seen := map[string]bool{}
	var out []string
	for _, root := range roots {
		if strings.TrimSpace(root) == "" {
			continue
		}
		root = filepath.Clean(root)
		_ = filepath.WalkDir(root, func(p string, d os.DirEntry, err error) error {
			if err != nil || d == nil {
				return nil
			}
			rel, _ := filepath.Rel(root, p)
			if d.IsDir() {
				if rel != "." && strings.Count(rel, string(os.PathSeparator)) >= 2 {
					return filepath.SkipDir
				}
				return nil
			}
			n := strings.ToLower(d.Name())
			if !strings.HasSuffix(n, ".exe") || !strings.Contains(n, "aram") || !strings.Contains(n, "fearless") {
				return nil
			}
			k := strings.ToLower(filepath.Clean(p))
			if !seen[k] {
				seen[k] = true
				out = append(out, filepath.Clean(p))
			}
			if len(out) >= 25 {
				return filepath.SkipAll
			}
			return nil
		})
	}
	sort.Strings(out)
	return out
}

func bootBlock(d BootJournalRecord) string {
	return fmt.Sprintf("=== BOOT DIAGNOSTIC ===\nAt: %s\nProcess kind: %s\nPID: %d\nBoot ID: %s\nExecutable: %s\nExecutable hash: %s\nExecutable modified time: %s\nCWD: %s\nApp version: %s\nRuntime version: %s\nInstalled version: %s\nActive version: %s\nBoot target: %s\nLaunch source: %s\nLast known good: %s\nPending update: %s\nRelaunch target: %s\nRollback reason: %s\nResources/app.asar path: %s\nCanonical launcher: %s\nNote: %s\n=======================\n", d.At, d.ProcessKind, d.PID, d.BootID, d.Executable, d.ExecutableSHA256, d.ExecutableModifiedTime, d.CWD, d.AppVersion, d.RuntimeVersion, d.InstalledVersion, d.ActiveVersion, d.BootTarget, d.LaunchSource, d.LastKnownGood, d.PendingUpdate, d.RelaunchTarget, d.RollbackReason, d.ResourcesAppAsar, d.CanonicalLauncher, d.Note)
}

func appendBootRecord(local string, d BootJournalRecord) {
	dir := bootDiagnosticDir(local)
	_ = os.MkdirAll(dir, 0755)
	b, _ := json.Marshal(d)
	if f, err := os.OpenFile(filepath.Join(dir, "boot-history.ndjson"), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644); err == nil {
		_, _ = f.Write(append(b, '\n'))
		_ = f.Close()
	}
	_ = writeJSONAtomic(filepath.Join(dir, "latest-launcher.json"), d)
	if f, err := os.OpenFile(filepath.Join(dir, "BOOT_DIAGNOSTIC.txt"), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644); err == nil {
		_, _ = f.WriteString(bootBlock(d) + "\n")
		_ = f.Close()
	}
}
