package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

func fail(local string, d LauncherDiagnostic, err error) {
	d.Error = err.Error()
	writeDiagnostic(local, d)
	_ = os.MkdirAll(diagnosticPath(local), 0755)
	_ = os.WriteFile(filepath.Join(diagnosticPath(local), "LAST_ERROR.txt"), []byte(err.Error()+"\n"), 0644)
}

func hasArg(name string) bool { for _, a := range os.Args[1:] { if a == name { return true } }; return false }
func argValue(name string) string { for i, a := range os.Args[1:] { if a == name && i+2 <= len(os.Args[1:]) { return os.Args[1:][i+1] } }; return "" }

func promoteOnly(local, self, appDir, expected string) error {
	if strings.TrimSpace(appDir) == "" { return fmt.Errorf("--app-dir is required") }
	selected := inspectCandidate(appDir, 0)
	if !selected.Valid { return fmt.Errorf("promotion app candidate invalid: %s", selected.Reason) }
	if expected != "" && compareVersion(selected.Version, expected) != 0 { return fmt.Errorf("promotion version mismatch: installed=%s expected=%s", selected.Version, expected) }
	canonical, err := ensureCanonicalLauncher(local, self)
	if err != nil { return fmt.Errorf("canonical launcher promotion failed: %w", err) }
	shortcuts := scanShortcutsWindows()
	repairs := repairProductShortcuts(shortcuts, canonical)
	if err := writeActiveInstall(local, canonical, selected); err != nil { return fmt.Errorf("active install pointer failed: %w", err) }
	cwd, _ := os.Getwd()
	bootID := strconv.FormatInt(time.Now().UTC().UnixNano(), 36)
	appendBootRecord(local, BootJournalRecord{Schema:2,At:time.Now().UTC().Format(time.RFC3339Nano),ProcessKind:"launcher-promotion",PID:os.Getpid(),BootID:bootID,Executable:self,ExecutableSHA256:fileSHA256(self),ExecutableModifiedTime:fileModifiedTime(self),CWD:cwd,AppVersion:selected.Version,RuntimeVersion:"launcher-"+launcherVersion,InstalledVersion:selected.Version,ActiveVersion:selected.Version,BootTarget:selected.AppDir,LaunchSource:"in-app-update-promotion",LastKnownGood:"(Electron safety owner)",PendingUpdate:"(none)",RelaunchTarget:canonical,RollbackReason:"(none)",ResourcesAppAsar:"(not applicable)",CanonicalLauncher:canonical,Shortcuts:shortcuts,ShortcutRepairs:repairs,DuplicateExecutables:scanKnownLauncherExecutables(local,self),Note:"v0.15.130 promoted installed runtime as persistent cold-start target; direct legacy EXEs are diagnosed but not overwritten"})
	return nil
}

func main() {
	local := os.Getenv("LOCALAPPDATA")
	if local == "" { return }
	self, _ := os.Executable()
	if hasArg("--promote-only") {
		if err := promoteOnly(local, self, argValue("--app-dir"), argValue("--expected-version")); err != nil {
			d:=LauncherDiagnostic{Schema:1,At:time.Now().UTC().Format(time.RFC3339Nano),LauncherVersion:launcherVersion,LauncherExecutable:self,LauncherSHA256:fileSHA256(self),LocalAppData:local,BootSource:"in-app-update-promotion"}; fail(local,d,err); os.Exit(2)
		}
		return
	}
	cwd, _ := os.Getwd()
	bootID := strconv.FormatInt(time.Now().UTC().UnixNano(), 36)
	canonical, canonicalErr := ensureCanonicalLauncher(local, self)
	shortcuts := scanShortcutsWindows()
	repairs := repairProductShortcuts(shortcuts, canonical)
	duplicates := scanKnownLauncherExecutables(local, self)
	cands := discoverCandidates(local)
	d := LauncherDiagnostic{Schema: 1, At: time.Now().UTC().Format(time.RFC3339Nano), LauncherVersion: launcherVersion, LauncherExecutable: self, LauncherSHA256: fileSHA256(self), CWD: cwd, LocalAppData: local, Candidates: cands, DuplicateInstalls: false, BootSource: "outer-launcher-cold-start"}
	valid := 0
	for _, c := range cands { if c.Valid { valid++ } }
	d.DuplicateInstalls = valid > 1
	selected, ok := selectCandidate(cands)
	if !ok {
		err := fmt.Errorf("no valid installed appfiles found; launcher will not overwrite or rehydrate a stale embedded base")
		fail(local, d, err)
		appendBootRecord(local, BootJournalRecord{Schema: 2, At: time.Now().UTC().Format(time.RFC3339Nano), ProcessKind: "launcher", PID: os.Getpid(), BootID: bootID, Executable: self, ExecutableSHA256: fileSHA256(self), ExecutableModifiedTime: fileModifiedTime(self), CWD: cwd, AppVersion: "(none)", RuntimeVersion: "launcher-" + launcherVersion, InstalledVersion: "(none)", ActiveVersion: "(none)", BootTarget: "(none)", LaunchSource: "outer-launcher-cold-start", RelaunchTarget: "(none)", CanonicalLauncher: canonical, Shortcuts: shortcuts, ShortcutRepairs: repairs, DuplicateExecutables: duplicates, Note: err.Error()})
		return
	}
	d.SelectedAppDir = selected.AppDir; d.SelectedVersion = selected.Version; d.SelectedMain = selected.Main
	electron := findElectron(local)
	var err error
	if electron == "" { electron, err = downloadElectron(local); if err != nil { fail(local, d, err); return } }
	d.ElectronExecutable = electron
	writeDiagnostic(local, d)
	pointerLauncher:=canonical; if canonicalErr!=nil || pointerLauncher=="" { pointerLauncher=self }
	pointerErr := writeActiveInstall(local, pointerLauncher, selected)
	activeVersion := selected.Version
	if a := readActiveInstall(local); a != nil && a.Version != "" { activeVersion = a.Version }
	noteParts := []string{"highest-valid-installed-appfiles selected; no embedded app hydration"}
	if canonicalErr != nil { noteParts = append(noteParts, "canonical launcher copy failed: "+canonicalErr.Error()) }
	if pointerErr != nil { noteParts = append(noteParts, "active pointer write failed: "+pointerErr.Error()) }
	if len(repairs) > 0 { noteParts = append(noteParts, fmt.Sprintf("shortcut repairs attempted=%d", len(repairs))) }
	appendBootRecord(local, BootJournalRecord{Schema:2,At:time.Now().UTC().Format(time.RFC3339Nano),ProcessKind:"launcher",PID:os.Getpid(),BootID:bootID,Executable:self,ExecutableSHA256:fileSHA256(self),ExecutableModifiedTime:fileModifiedTime(self),CWD:cwd,AppVersion:selected.Version,RuntimeVersion:"launcher-"+launcherVersion,InstalledVersion:selected.Version,ActiveVersion:activeVersion,BootTarget:selected.AppDir,LaunchSource:"outer-launcher-cold-start",LastKnownGood:"(Electron safety owner)",PendingUpdate:"(Electron safety owner)",RelaunchTarget:electron+" -> "+selected.AppDir,RollbackReason:"(none at launcher selection)",ResourcesAppAsar:"(not applicable to outer launcher)",CanonicalLauncher:canonical,Shortcuts:shortcuts,ShortcutRepairs:repairs,DuplicateExecutables:duplicates,Note:strings.Join(noteParts,"; ")})
	cmd := exec.Command(electron, selected.AppDir, "--aram-launcher-cold-start")
	cmd.Dir = selected.AppDir
	cmd.Env = append(os.Environ(), "ARAM_LAUNCHER_VERSION="+launcherVersion, "ARAM_LAUNCHER_EXECUTABLE="+self, "ARAM_LAUNCHER_CANONICAL="+canonical, "ARAM_LAUNCHER_APPDIR="+selected.AppDir, "ARAM_LAUNCHER_SELECTED_VERSION="+selected.Version, "ARAM_LAUNCHER_BOOT_ID="+bootID)
	if err := cmd.Start(); err != nil { fail(local, d, err); return }
}
