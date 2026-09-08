# ARAM Fearless Draft Stable Update Channel

The personal stable launcher reads `update/manifest.json` from the public `main` branch.

- Base app: v0.15.9 is embedded in the stable launcher.
- Future versions are applied as verified file-level patches listed in the manifest.
- Every patch file must include a SHA-256 digest in the manifest.
- Update staging is atomic: a failed download or hash check keeps the last known-good app version.
- Optional personal BGM is not redistributed from this public repository. The stable launcher keeps that asset locally and passes it to the desktop app through `ARAM_BGM_PATH`.
- A launcher replacement is needed only when `min_launcher` is raised beyond the user's launcher version.

This channel exists so one representative launcher can keep using newer app versions without requiring the user to download a new EXE for ordinary app updates.
