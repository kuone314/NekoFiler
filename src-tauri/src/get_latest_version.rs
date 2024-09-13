
///////////////////////////////////////////////////////////////////////////////////////////////////
#[tauri::command]
pub fn get_latest_version() -> Option<String> {
    let html = get_release_page_htlm()?;
    let key_text_front = r#"kuone314/NekoFiler/releases/tag/"#;
    let found = html.find(key_text_front)?;

    let remain = &html[found + key_text_front.len()..];

    let key_text_back = r#"""#;
    let found = remain.find(key_text_back)?;
    Some(remain[..found].to_owned())
}

fn get_release_page_htlm() -> Option<String> {
    use curl::easy::Easy;

    let mut data = Vec::new();
    let mut handle = Easy::new();
    handle
        .url("https://github.com/kuone314/NekoFiler/releases")
        .unwrap();
    {
        let mut transfer = handle.transfer();
        transfer
            .write_function(|new_data| {
                data.extend_from_slice(new_data);
                Ok(new_data.len())
            })
            .unwrap();
        transfer.perform().unwrap();
    }
    Some(String::from_utf8(data).ok()?)
}
