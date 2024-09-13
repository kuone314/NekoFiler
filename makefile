
.PHONY: release

release:
	npm install
	npm run tauri build
	copy "src-tauri\target\release\neko_filer.exe" "."
