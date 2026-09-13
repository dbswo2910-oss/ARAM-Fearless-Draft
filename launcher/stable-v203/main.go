package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
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
		fail(local, d, fmt.Errorf("no valid installed appfiles found; launcher will not overwrite or rehydrate a stale embedded base"))
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
	bootID := strconv.FormatInt(time.Now().UTC().UnixNano(), 36)
	cmd := exec.Command(electron, selected.AppDir, "--aram-launcher-cold-start")
	cmd.Dir = selected.AppDir
	cmd.Env = append(os.Environ(), "ARAM_LAUNCHER_VERSION="+launcherVersion, "ARAM_LAUNCHER_EXECUTABLE="+self, "ARAM_LAUNCHER_APPDIR="+selected.AppDir, "ARAM_LAUNCHER_SELECTED_VERSION="+selected.Version, "ARAM_LAUNCHER_BOOT_ID="+bootID)
	if err := cmd.Start(); err != nil {
		fail(local, d, err)
		return
	}
}
