
.PHONY: release

release:
	npm run tauri build
	copy "src-tauri\target\release\amaterasu_filer.exe" "."
