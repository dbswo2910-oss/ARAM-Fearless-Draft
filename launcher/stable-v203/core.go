package main

import (
	"archive/zip"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"
)

const (
	launcherVersion = "2.0.3"
	electronVersion = "44.2.0"
	electronSHA256  = "4021363e3090d67a144ebedb90765cf193b0e61f300c519c83f0174502a481da"
	electronURL     = "https://github.com/electron/electron/releases/download/v44.2.0/electron-v44.2.0-win32-x64.zip"
)

type PackageMeta struct {
	Name    string `json:"name"`
	Version string `json:"version"`
	Main    string `json:"main"`
}

type AppCandidate struct {
	AppDir        string `json:"appDir"`
	Version       string `json:"version"`
	Main          string `json:"main"`
	PackageSHA256 string `json:"packageSha256"`
	MainSHA256    string `json:"mainSha256"`
	Valid         bool   `json:"valid"`
	Reason        string `json:"reason,omitempty"`
	Priority      int    `json:"priority"`
}

type LauncherDiagnostic struct {
	Schema             int            `json:"schema"`
	At                 string         `json:"at"`
	LauncherVersion    string         `json:"launcherVersion"`
	LauncherExecutable string         `json:"launcherExecutable"`
	LauncherSHA256     string         `json:"launcherSha256,omitempty"`
	CWD                string         `json:"cwd"`
	LocalAppData       string         `json:"localAppData"`
	Candidates         []AppCandidate `json:"candidates"`
	SelectedAppDir     string         `json:"selectedAppDir,omitempty"`
	SelectedVersion    string         `json:"selectedVersion,omitempty"`
	SelectedMain       string         `json:"selectedMain,omitempty"`
	ElectronExecutable string         `json:"electronExecutable,omitempty"`
	DuplicateInstalls  bool           `json:"duplicateInstalls"`
	BootSource         string         `json:"bootSource"`
	Error              string         `json:"error,omitempty"`
}

func parseVersion(v string) ([]int, error) {
	s := strings.TrimSpace(strings.TrimPrefix(strings.ToLower(v), "v"))
	if i := strings.IndexAny(s, "+-"); i >= 0 {
		s = s[:i]
	}
	if s == "" {
		return nil, errors.New("empty version")
	}
	parts := strings.Split(s, ".")
	out := make([]int, len(parts))
	for i, p := range parts {
		if p == "" {
			return nil, fmt.Errorf("invalid version %q", v)
		}
		n, err := strconv.Atoi(p)
		if err != nil || n < 0 {
			return nil, fmt.Errorf("invalid version %q", v)
		}
		out[i] = n
	}
	return out, nil
}

func compareVersion(a, b string) int {
	A, ea := parseVersion(a)
	B, eb := parseVersion(b)
	if ea != nil && eb != nil {
		return strings.Compare(a, b)
	}
	if ea != nil {
		return -1
	}
	if eb != nil {
		return 1
	}
	n := len(A)
	if len(B) > n {
		n = len(B)
	}
	for i := 0; i < n; i++ {
		av, bv := 0, 0
		if i < len(A) {
			av = A[i]
		}
		if i < len(B) {
			bv = B[i]
		}
		if av > bv {
			return 1
		}
		if av < bv {
			return -1
		}
	}
	return 0
}

func fileSHA256(path string) string {
	f, err := os.Open(path)
	if err != nil {
		return ""
	}
	defer f.Close()
	h := sha256.New()
	if _, err = io.Copy(h, f); err != nil {
		return ""
	}
	return hex.EncodeToString(h.Sum(nil))
}

func inspectCandidate(appDir string, priority int) AppCandidate {
	c := AppCandidate{AppDir: filepath.Clean(appDir), Priority: priority}
	pkgPath := filepath.Join(c.AppDir, "package.json")
	b, err := os.ReadFile(pkgPath)
	if err != nil {
		c.Reason = "package.json missing"
		return c
	}
	var p PackageMeta
	if json.Unmarshal(b, &p) != nil || p.Version == "" || p.Main == "" {
		c.Reason = "invalid package.json"
		return c
	}
	if _, err := parseVersion(p.Version); err != nil {
		c.Reason = err.Error()
		return c
	}
	mainPath := filepath.Join(c.AppDir, filepath.Clean(p.Main))
	st, err := os.Stat(mainPath)
	if err != nil || st.IsDir() {
		c.Reason = "package main missing"
		return c
	}
	c.Version = p.Version
	c.Main = p.Main
	c.PackageSHA256 = fileSHA256(pkgPath)
	c.MainSHA256 = fileSHA256(mainPath)
	c.Valid = true
	return c
}

func knownAppDirs(local string) []string {
	seen := map[string]bool{}
	var out []string
	add := func(p string) {
		k := strings.ToLower(filepath.Clean(p))
		if !seen[k] {
			seen[k] = true
			out = append(out, filepath.Clean(p))
		}
	}
	roots := []string{filepath.Join(local, "ARAM Fearless Draft AutoUpdate"), filepath.Join(local, "ARAM Fearless Draft AutoUpdater")}
	for _, r := range roots {
		add(filepath.Join(r, "appfiles"))
	}
	entries, _ := os.ReadDir(local)
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		n := e.Name()
		if strings.HasPrefix(strings.ToLower(n), strings.ToLower("ARAM Fearless Draft AutoUpdate")) {
			r := filepath.Join(local, n)
			add(filepath.Join(r, "appfiles"))
			if strings.HasSuffix(strings.ToLower(n), "appfiles") {
				add(r)
			}
		}
	}
	return out
}

func discoverCandidates(local string) []AppCandidate {
	dirs := knownAppDirs(local)
	out := make([]AppCandidate, 0, len(dirs))
	for i, d := range dirs {
		out = append(out, inspectCandidate(d, i))
	}
	return out
}

func selectCandidate(cands []AppCandidate) (AppCandidate, bool) {
	valid := make([]AppCandidate, 0, len(cands))
	for _, c := range cands {
		if c.Valid {
			valid = append(valid, c)
		}
	}
	if len(valid) == 0 {
		return AppCandidate{}, false
	}
	sort.SliceStable(valid, func(i, j int) bool {
		cmp := compareVersion(valid[i].Version, valid[j].Version)
		if cmp != 0 {
			return cmp > 0
		}
		return valid[i].Priority < valid[j].Priority
	})
	return valid[0], true
}

func knownRuntimeRoots(local string) []string {
	return []string{filepath.Join(local, "ARAM Fearless Draft AutoUpdate"), filepath.Join(local, "ARAM Fearless Draft AutoUpdater"), filepath.Join(local, "ARAM Fearless Draft")}
}

func findElectron(local string) string {
	if p := strings.TrimSpace(os.Getenv("ARAM_ELECTRON_EXE")); p != "" {
		if st, e := os.Stat(p); e == nil && !st.IsDir() {
			return p
		}
	}
	for _, root := range knownRuntimeRoots(local) {
		direct := []string{filepath.Join(root, "electron.exe"), filepath.Join(root, "electron", "electron.exe"), filepath.Join(root, "electron-v"+electronVersion+"-win32-x64", "electron.exe"), filepath.Join(root, "runtime", "electron-v"+electronVersion+"-win32-x64", "electron.exe")}
		for _, p := range direct {
			if st, e := os.Stat(p); e == nil && !st.IsDir() {
				return p
			}
		}
		entries, _ := os.ReadDir(root)
		for _, e := range entries {
			if !e.IsDir() {
				continue
			}
			p := filepath.Join(root, e.Name(), "electron.exe")
			if st, er := os.Stat(p); er == nil && !st.IsDir() {
				return p
			}
		}
	}
	return ""
}

func downloadElectron(local string) (string, error) {
	root := filepath.Join(local, "ARAM Fearless Draft AutoUpdate", "runtime")
	target := filepath.Join(root, "electron-v"+electronVersion+"-win32-x64")
	exe := filepath.Join(target, "electron.exe")
	if st, e := os.Stat(exe); e == nil && !st.IsDir() {
		return exe, nil
	}
	if err := os.MkdirAll(root, 0755); err != nil {
		return "", err
	}
	tmp := filepath.Join(root, "electron-v"+electronVersion+".zip.part")
	_ = os.Remove(tmp)
	client := &http.Client{Timeout: 4 * time.Minute}
	resp, err := client.Get(electronURL)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return "", fmt.Errorf("electron download HTTP %d", resp.StatusCode)
	}
	f, err := os.Create(tmp)
	if err != nil {
		return "", err
	}
	_, err = io.Copy(f, resp.Body)
	cerr := f.Close()
	if err != nil {
		return "", err
	}
	if cerr != nil {
		return "", cerr
	}
	if got := fileSHA256(tmp); !strings.EqualFold(got, electronSHA256) {
		_ = os.Remove(tmp)
		return "", fmt.Errorf("electron SHA-256 mismatch: %s", got)
	}
	_ = os.RemoveAll(target)
	if err := os.MkdirAll(target, 0755); err != nil {
		return "", err
	}
	zr, err := zip.OpenReader(tmp)
	if err != nil {
		return "", err
	}
	defer zr.Close()
	base := filepath.Clean(target) + string(os.PathSeparator)
	for _, z := range zr.File {
		dst := filepath.Join(target, z.Name)
		if !strings.HasPrefix(filepath.Clean(dst)+func() string {
			if z.FileInfo().IsDir() {
				return string(os.PathSeparator)
			}
			return ""
		}(), base) && filepath.Clean(dst) != filepath.Clean(target) {
			return "", errors.New("unsafe electron zip path")
		}
		if z.FileInfo().IsDir() {
			if err := os.MkdirAll(dst, 0755); err != nil {
				return "", err
			}
			continue
		}
		if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
			return "", err
		}
		in, e := z.Open()
		if e != nil {
			return "", e
		}
		out, e := os.OpenFile(dst, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, z.Mode())
		if e != nil {
			in.Close()
			return "", e
		}
		_, e = io.Copy(out, in)
		ce1 := out.Close()
		ce2 := in.Close()
		if e != nil {
			return "", e
		}
		if ce1 != nil {
			return "", ce1
		}
		if ce2 != nil {
			return "", ce2
		}
	}
	_ = os.Remove(tmp)
	if st, e := os.Stat(exe); e != nil || st.IsDir() {
		return "", errors.New("electron.exe missing after extraction")
	}
	return exe, nil
}

func diagnosticPath(local string) string {
	return filepath.Join(local, "ARAM Fearless Draft AutoUpdate", "launcher-diagnostics")
}
func writeDiagnostic(local string, d LauncherDiagnostic) {
	dir := diagnosticPath(local)
	_ = os.MkdirAll(dir, 0755)
	b, _ := json.MarshalIndent(d, "", "  ")
	_ = os.WriteFile(filepath.Join(dir, "latest.json"), append(b, '\n'), 0644)
	f, _ := os.OpenFile(filepath.Join(dir, "history.ndjson"), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if f != nil {
		line, _ := json.Marshal(d)
		_, _ = f.Write(append(line, '\n'))
		_ = f.Close()
	}
}
