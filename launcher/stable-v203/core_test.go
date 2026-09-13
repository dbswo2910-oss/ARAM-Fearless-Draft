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
	if err := os.MkdirAll(d, 0755); err != nil { t.Fatal(err) }
	p := PackageMeta{Name: "aram-fearless-draft", Version: version, Main: "main-v" + version + ".js"}
	b, _ := json.Marshal(p)
	if err := os.WriteFile(filepath.Join(d, "package.json"), b, 0644); err != nil { t.Fatal(err) }
	if err := os.WriteFile(filepath.Join(d, p.Main), []byte("// "+version), 0644); err != nil { t.Fatal(err) }
	return d
}
func selected(t *testing.T, root string) AppCandidate { t.Helper(); c, ok := selectCandidate(discoverCandidates(root)); if !ok { t.Fatal("no selection") }; return c }

func TestCaseA126To128ColdRestartStays128(t *testing.T) {
	root := t.TempDir(); app(t, root, "ARAM Fearless Draft AutoUpdater", "0.15.126"); app(t, root, "ARAM Fearless Draft AutoUpdate", "0.15.128")
	for i := 0; i < 3; i++ { if g := selected(t, root).Version; g != "0.15.128" { t.Fatalf("cold boot %d selected %s", i+1, g) } }
}
func TestCaseB128To129ColdRestartStays129(t *testing.T) {
	root := t.TempDir(); app(t, root, "ARAM Fearless Draft AutoUpdater", "0.15.128"); app(t, root, "ARAM Fearless Draft AutoUpdate", "0.15.129")
	if g := selected(t, root).Version; g != "0.15.129" { t.Fatalf("selected %s", g) }
}
func TestCaseDDuplicateInstallChoosesHighestAndReportsAll(t *testing.T) {
	root := t.TempDir(); app(t, root, "ARAM Fearless Draft AutoUpdate-old", "0.15.126"); app(t, root, "ARAM Fearless Draft AutoUpdate-new", "0.15.129")
	cs := discoverCandidates(root); valid := 0; for _, c := range cs { if c.Valid { valid++ } }; if valid < 2 { t.Fatalf("wanted duplicate installs, got %d", valid) }
	c, _ := selectCandidate(cs); if c.Version != "0.15.129" { t.Fatalf("selected %s", c.Version) }
}
func TestNumericSemverNotLexicographic(t *testing.T) {
	if compareVersion("0.15.129", "0.15.99") <= 0 { t.Fatal("numeric compare failed") }
	if compareVersion("0.15.128", "0.15.126") <= 0 { t.Fatal("128 should exceed 126") }
}
func TestInvalidCandidateNeverWins(t *testing.T) {
	root := t.TempDir(); bad := filepath.Join(root, "ARAM Fearless Draft AutoUpdate", "appfiles"); _ = os.MkdirAll(bad, 0755); _ = os.WriteFile(filepath.Join(bad, "package.json"), []byte(`{"version":"9.9.9","main":"missing.js"}`), 0644); app(t, root, "ARAM Fearless Draft AutoUpdater", "0.15.128")
	if g := selected(t, root).Version; g != "0.15.128" { t.Fatalf("selected %s", g) }
}
