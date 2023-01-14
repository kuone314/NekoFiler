
.PHONY: release

release:
	npm run tauri build
	rmdir /s /q "release_module" || :
	mkdir "release_module"
	copy "src-tauri\target\release\amaterasu_filer.exe" "release_module"
	echo D | xcopy "AmaterasuFilerSettings" "release_module\AmaterasuFilerSettings"
