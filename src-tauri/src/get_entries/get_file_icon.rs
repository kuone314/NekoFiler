use base64;

use winapi::um::shellapi::{SHGetFileInfoW, SHGFI_ICON, SHGFI_SMALLICON};
use winapi::um::wingdi::DeleteObject;

use std::mem;
use std::os::windows::ffi::OsStrExt;
use std::ptr;
use winapi::um::wingdi::{
    CreateCompatibleBitmap, CreateCompatibleDC, DeleteDC, GetDIBits, SelectObject, BITMAPINFO,
    BITMAPINFOHEADER,
};
use winapi::um::winuser::{GetDC, ReleaseDC};

use winapi::shared::windef::{HBITMAP, HICON};

use winapi::um::wingdi::{GetObjectW, BITMAP};
use winapi::um::winuser::{DrawIconEx, GetIconInfo, ICONINFO};

use winapi::um::shellapi::SHFILEINFOW;
use winapi::um::winuser::DestroyIcon;
use winapi::um::wingdi::{BITMAPFILEHEADER, BI_RGB};

pub fn get_file_icon(filepath: &str) -> Option<String> {
    let icon = extract_icon_from_file(&filepath)?;
    let bitmap = icon_to_bitmap(icon)?;
    unsafe {
        DestroyIcon(icon);
    }
    let bites = bitmap_to_bites(bitmap)?;
    unsafe {
        DeleteObject(bitmap as *mut _);
    }
    Some(base64::encode(&bites))
}

fn extract_icon_from_file(file_name: &str) -> Option<HICON> {
    unsafe {
        let file_name = std::ffi::OsStr::new(file_name)
            .encode_wide()
            .chain(std::iter::once(0))
            .collect::<Vec<_>>();
        let mut sfi: SHFILEINFOW = mem::zeroed();
        if SHGetFileInfoW(
            file_name.as_ptr(),
            0,
            &mut sfi as *mut SHFILEINFOW,
            mem::size_of::<SHFILEINFOW>() as u32,
            SHGFI_ICON | SHGFI_SMALLICON,
        ) != 0
        {
            Some(sfi.hIcon)
        } else {
            None
        }
    }
}

fn icon_to_bitmap(h_icon: HICON) -> Option<HBITMAP> {
    let icon_info = unsafe {
        let mut icon_info: ICONINFO = mem::zeroed();
        if GetIconInfo(h_icon, &mut icon_info as *mut ICONINFO) == 0 {
            return None;
        }
        icon_info
    };

    let bmp = unsafe {
        let mut bmp: BITMAP = mem::zeroed();
        if GetObjectW(
            icon_info.hbmColor as *mut _,
            mem::size_of::<BITMAP>() as i32,
            &mut bmp as *mut BITMAP as *mut _,
        ) == 0
        {
            return None;
        }
        bmp
    };

    unsafe {
        let hdc_screen = GetDC(ptr::null_mut());
        let hdc_mem = CreateCompatibleDC(hdc_screen);
        let h_bitmap = CreateCompatibleBitmap(hdc_screen, bmp.bmWidth, bmp.bmHeight);

        let h_old_obj = SelectObject(hdc_mem, h_bitmap as *mut _);
        if DrawIconEx(
            hdc_mem,
            0,
            0,
            h_icon,
            bmp.bmWidth,
            bmp.bmHeight,
            0,
            ptr::null_mut(),
            3,
        ) != 0
        {
            SelectObject(hdc_mem, h_old_obj as *mut _);
            DeleteDC(hdc_mem);
            ReleaseDC(ptr::null_mut(), hdc_screen);
            DeleteObject(icon_info.hbmMask as *mut _);
            DeleteObject(icon_info.hbmColor as *mut _);
            Some(h_bitmap)
        } else {
            DeleteDC(hdc_mem);
            None
        }
    }
}

fn bitmap_to_bites(h_bitmap: HBITMAP) -> Option<Vec<u8>> {
    let bmp = unsafe {
        let mut bmp: BITMAP = mem::zeroed();
        if GetObjectW(
            h_bitmap as *mut _,
            mem::size_of::<BITMAP>() as i32,
            &mut bmp as *mut BITMAP as *mut _,
        ) == 0
        {
            return None;
        }
        bmp
    };

    let mut bmf_header: BITMAPFILEHEADER = unsafe { std::mem::zeroed() };
    bmf_header.bfType = 0x4D42; // "BM"
    bmf_header.bfSize = (std::mem::size_of::<BITMAPFILEHEADER>()
        + std::mem::size_of::<BITMAPINFOHEADER>()) as u32
        + (bmp.bmWidthBytes * bmp.bmHeight) as u32;
    bmf_header.bfOffBits = std::mem::size_of::<BITMAPFILEHEADER>() as u32
        + std::mem::size_of::<BITMAPINFOHEADER>() as u32;

    let mut bi: BITMAPINFOHEADER = unsafe { std::mem::zeroed() };
    bi.biSize = std::mem::size_of::<BITMAPINFOHEADER>() as u32;
    bi.biWidth = bmp.bmWidth;
    bi.biHeight = bmp.bmHeight;
    bi.biPlanes = 1;
    bi.biBitCount = bmp.bmBitsPixel;
    bi.biCompression = BI_RGB;
    bi.biSizeImage = (bmp.bmWidthBytes * bmp.bmHeight) as u32;

    let header_bytes: [u8; mem::size_of::<BITMAPFILEHEADER>()] =
        unsafe { mem::transmute(bmf_header) };
    let info_bytes: [u8; mem::size_of::<BITMAPINFOHEADER>()] = unsafe { mem::transmute(bi) };

    let hdc_screen = unsafe { GetDC(ptr::null_mut()) };
    let hdc_mem = unsafe { CreateCompatibleDC(hdc_screen) };
    unsafe { SelectObject(hdc_mem, h_bitmap as *mut _) };

    let height = bmp.bmHeight.abs();

    let mut bmi: BITMAPINFO = unsafe { std::mem::zeroed() };
    bmi.bmiHeader = bi;

    let mut pixels: Vec<u8> = vec![0; (bmp.bmWidthBytes * height) as usize];
    unsafe {
        GetDIBits(
            hdc_mem,
            h_bitmap,
            0,
            height.try_into().unwrap(),
            pixels.as_mut_ptr() as *mut _,
            &mut bmi,
            winapi::um::wingdi::DIB_RGB_COLORS,
        );

        ReleaseDC(ptr::null_mut(), hdc_screen);
        DeleteDC(hdc_mem);
    };

    let mut combined_bytes = Vec::new();
    combined_bytes.extend_from_slice(&header_bytes);
    combined_bytes.extend_from_slice(&info_bytes);
    combined_bytes.extend_from_slice(&pixels);
    Some(combined_bytes)
}
