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
	_ = os.WriteFile(filepath.Join(diagnosticPath(local), "LAST_ERROR.txt"), []byte(err.Error()+"\n"), 0644)
}

func main() {
	local := os.Getenv("LOCALAPPDATA")
	if local == "" {
		return
	}
	self, _ := os.Executable()
	cwd, _ := os.Getwd()
	bootID := strconv.FormatInt(time.Now().UTC().UnixNano(), 36)
	canonical, canonicalErr := ensureCanonicalLauncher(local, self)
	shortcuts := scanShortcutsWindows()
	repairs := repairProductShortcuts(shortcuts, canonical)
	duplicates := scanKnownLauncherExecutables(local, self)
	cands := discoverCandidates(local)
	d := LauncherDiagnostic{Schema: 1, At: time.Now().UTC().Format(time.RFC3339Nano), LauncherVersion: launcherVersion, LauncherExecutable: self, LauncherSHA256: fileSHA256(self), CWD: cwd, LocalAppData: local, Candidates: cands, DuplicateInstalls: false, BootSource: "outer-launcher-cold-start"}
	valid := 0
	for _, c := range cands {
		if c.Valid {
			valid++
		}
	}
	d.DuplicateInstalls = valid > 1
	selected, ok := selectCandidate(cands)
	if !ok {
		err := fmt.Errorf("no valid installed appfiles found; launcher will not overwrite or rehydrate a stale embedded base")
		fail(local, d, err)
		appendBootRecord(local, BootJournalRecord{Schema: 2, At: time.Now().UTC().Format(time.RFC3339Nano), ProcessKind: "launcher", PID: os.Getpid(), BootID: bootID, Executable: self, ExecutableSHA256: fileSHA256(self), ExecutableModifiedTime: fileModifiedTime(self), CWD: cwd, AppVersion: "(none)", RuntimeVersion: "launcher-" + launcherVersion, InstalledVersion: "(none)", ActiveVersion: "(none)", BootTarget: "(none)", LaunchSource: "outer-launcher-cold-start", RelaunchTarget: "(none)", CanonicalLauncher: canonical, Shortcuts: shortcuts, ShortcutRepairs: repairs, DuplicateExecutables: duplicates, Note: err.Error()})
		return
	}
	d.SelectedAppDir = selected.AppDir
	d.SelectedVersion = selected.Version
	d.SelectedMain = selected.Main
	electron := findElectron(local)
	var err error
	if electron == "" {
		electron, err = downloadElectron(local)
		if err != nil {
			fail(local, d, err)
			return
		}
	}
	d.ElectronExecutable = electron
	writeDiagnostic(local, d)
	pointerErr := writeActiveInstall(local, self, selected)
	activeVersion := selected.Version
	if a := readActiveInstall(local); a != nil && a.Version != "" {
		activeVersion = a.Version
	}
	noteParts := []string{"highest-valid-installed-appfiles selected; no embedded app hydration"}
	if canonicalErr != nil {
		noteParts = append(noteParts, "canonical launcher copy failed: "+canonicalErr.Error())
	}
	if pointerErr != nil {
		noteParts = append(noteParts, "active pointer write failed: "+pointerErr.Error())
	}
	if len(repairs) > 0 {
		noteParts = append(noteParts, fmt.Sprintf("shortcut repairs attempted=%d", len(repairs)))
	}
	appendBootRecord(local, BootJournalRecord{
		Schema:                 2,
		At:                     time.Now().UTC().Format(time.RFC3339Nano),
		ProcessKind:            "launcher",
		PID:                    os.Getpid(),
		BootID:                 bootID,
		Executable:             self,
		ExecutableSHA256:       fileSHA256(self),
		ExecutableModifiedTime: fileModifiedTime(self),
		CWD:                    cwd,
		AppVersion:             selected.Version,
		RuntimeVersion:         "launcher-" + launcherVersion,
		InstalledVersion:       selected.Version,
		ActiveVersion:          activeVersion,
		BootTarget:             selected.AppDir,
		LaunchSource:           "outer-launcher-cold-start",
		LastKnownGood:          "(Electron safety owner)",
		PendingUpdate:          "(Electron safety owner)",
		RelaunchTarget:         electron + " -> " + selected.AppDir,
		RollbackReason:         "(none at launcher selection)",
		ResourcesAppAsar:       "(not applicable to outer launcher)",
		CanonicalLauncher:      canonical,
		Shortcuts:              shortcuts,
		ShortcutRepairs:        repairs,
		DuplicateExecutables:   duplicates,
		Note:                   strings.Join(noteParts, "; "),
	})
	cmd := exec.Command(electron, selected.AppDir, "--aram-launcher-cold-start")
	cmd.Dir = selected.AppDir
	cmd.Env = append(os.Environ(), "ARAM_LAUNCHER_VERSION="+launcherVersion, "ARAM_LAUNCHER_EXECUTABLE="+self, "ARAM_LAUNCHER_CANONICAL="+canonical, "ARAM_LAUNCHER_APPDIR="+selected.AppDir, "ARAM_LAUNCHER_SELECTED_VERSION="+selected.Version, "ARAM_LAUNCHER_BOOT_ID="+bootID)
	if err := cmd.Start(); err != nil {
		fail(local, d, err)
		return
	}
}
