package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func app(t *testing.T, root, name, version string) string {
	t.Helper()
	d := filepath.Join(root, name, "appfiles")
	if err := os.MkdirAll(d, 0755); err != nil {
		t.Fatal(err)
	}
	p := PackageMeta{Name: "aram-fearless-draft", Version: version, Main: "main-v" + version + ".js"}
	b, _ := json.Marshal(p)
	if err := os.WriteFile(filepath.Join(d, "package.json"), b, 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(d, p.Main), []byte("// "+version), 0644); err != nil {
		t.Fatal(err)
	}
	return d
}
func selected(t *testing.T, root string) AppCandidate {
	t.Helper()
	c, ok := selectCandidate(discoverCandidates(root))
	if !ok {
		t.Fatal("no selection")
	}
	return c
}

func TestCaseA129To130FirstColdRestartStays130(t *testing.T) {
	root := t.TempDir()
	app(t, root, "ARAM Fearless Draft AutoUpdater", "0.15.129")
	app(t, root, "ARAM Fearless Draft AutoUpdate", "0.15.130")
	if g := selected(t, root).Version; g != "0.15.130" {
		t.Fatalf("first cold boot selected %s", g)
	}
}
func TestCaseBThreeConsecutiveColdStartsStay130(t *testing.T) {
	root := t.TempDir()
	app(t, root, "ARAM Fearless Draft AutoUpdater", "0.15.126")
	app(t, root, "ARAM Fearless Draft AutoUpdate", "0.15.130")
	for i := 0; i < 3; i++ {
		if g := selected(t, root).Version; g != "0.15.130" {
			t.Fatalf("cold boot %d selected %s", i+1, g)
		}
	}
}
func TestCaseCDuplicateInstallChoosesHighest(t *testing.T) {
	root := t.TempDir()
	app(t, root, "ARAM Fearless Draft AutoUpdate-old", "0.15.126")
	app(t, root, "ARAM Fearless Draft AutoUpdate-new", "0.15.130")
	cs := discoverCandidates(root)
	valid := 0
	for _, c := range cs {
		if c.Valid {
			valid++
		}
	}
	if valid < 2 {
		t.Fatalf("wanted duplicate installs, got %d", valid)
	}
	c, _ := selectCandidate(cs)
	if c.Version != "0.15.130" {
		t.Fatalf("selected %s", c.Version)
	}
}
func TestCaseDRollbackOnlyWhenLatestInvalid(t *testing.T) {
	root := t.TempDir()
	bad := app(t, root, "ARAM Fearless Draft AutoUpdate", "0.15.130")
	if err := os.Remove(filepath.Join(bad, "main-v0.15.130.js")); err != nil {
		t.Fatal(err)
	}
	app(t, root, "ARAM Fearless Draft AutoUpdater", "0.15.129")
	if g := selected(t, root).Version; g != "0.15.129" {
		t.Fatalf("invalid latest must fall back to valid previous, got %s", g)
	}
}
func TestNumericSemverNotLexicographic(t *testing.T) {
	if compareVersion("0.15.130", "0.15.99") <= 0 {
		t.Fatal("numeric compare failed")
	}
	if compareVersion("0.15.130", "0.15.129") <= 0 {
		t.Fatal("130 should exceed 129")
	}
}
func TestPromoteOnlyWrites130ActivePointerAndCanonicalLauncher(t *testing.T) {
	root := t.TempDir()
	d := app(t, root, "ARAM Fearless Draft AutoUpdate", "0.15.130")
	self := filepath.Join(root, "release-launcher.exe")
	if err := os.WriteFile(self, []byte("launcher-v203"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := promoteOnly(root, self, d, "0.15.130"); err != nil {
		t.Fatal(err)
	}
	a := readActiveInstall(root)
	if a == nil || a.Version != "0.15.130" || filepath.Clean(a.AppDir) != filepath.Clean(d) {
		t.Fatalf("bad active pointer: %#v", a)
	}
	canonical := canonicalLauncherPath(root)
	if fileSHA256(self) == "" || fileSHA256(self) != fileSHA256(canonical) {
		t.Fatal("canonical launcher hash mismatch")
	}
	if !filepath.IsAbs(a.LauncherExecutable) || filepath.Clean(a.LauncherExecutable) != filepath.Clean(canonical) {
		t.Fatalf("active launcher not canonical: %s", a.LauncherExecutable)
	}
}
func TestPromoteOnlyRejectsWrongVersion(t *testing.T) {
	root := t.TempDir()
	d := app(t, root, "ARAM Fearless Draft AutoUpdate", "0.15.129")
	self := filepath.Join(root, "release-launcher.exe")
	_ = os.WriteFile(self, []byte("launcher"), 0755)
	if err := promoteOnly(root, self, d, "0.15.130"); err == nil {
		t.Fatal("expected version mismatch")
	}
}
