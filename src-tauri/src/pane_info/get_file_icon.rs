use base64;

use winapi::um::shellapi::{SHGetFileInfoW, SHGFI_ICON, SHGFI_SMALLICON};
use winapi::um::wingdi::DeleteObject;

use std::mem;
use std::os::windows::ffi::OsStrExt;
use std::path::PathBuf;
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
use winapi::um::wingdi::PatBlt;
use winapi::um::wingdi::WHITENESS;
use winapi::um::wingdi::{BITMAPFILEHEADER, BI_RGB};
use winapi::um::winuser::DestroyIcon;

use winapi::um::commctrl::{ImageList_GetIcon, HIMAGELIST, ILD_NORMAL, INDEXTOOVERLAYMASK};
use winapi::um::shellapi::{SHGFI_OVERLAYINDEX, SHGFI_SYSICONINDEX};

pub fn get_file_icon(filepath: &PathBuf) -> Option<String> {
  let icon = extract_icon_from_file(&filepath)?;
  let bitmap = icon_to_bitmap(icon.data)?;
  let bites = bitmap_to_bites(bitmap.data)?;
  Some(base64::encode(&bites))
}

struct AutoRelease<'a, T> {
  data: T,
  release_func: Box<dyn FnMut(&mut T) + 'a>,
}

impl<'a, T> Drop for AutoRelease<'a, T> {
  fn drop(&mut self) {
    (self.release_func)(&mut self.data);
  }
}

fn extract_icon_from_file(file_name: &PathBuf) -> Option<AutoRelease<HICON>> {
  let file_name = std::ffi::OsStr::new(&file_name.to_str()?)
    .encode_wide()
    .chain(std::iter::once(0))
    .collect::<Vec<_>>();
  unsafe {
    let mut shfi: SHFILEINFOW = std::mem::zeroed();
    let handle = SHGetFileInfoW(
      file_name.as_ptr(),
      0x0000020, // FILE_ATTRIBUTE_ARCHIVE
      &mut shfi,
      std::mem::size_of::<SHFILEINFOW>() as u32,
      SHGFI_SMALLICON | SHGFI_SYSICONINDEX | SHGFI_OVERLAYINDEX | SHGFI_ICON,
    );

    if handle == 0 {
      return None;
    }

    let handle = handle as HIMAGELIST;
    DestroyIcon(shfi.hIcon);

    let d_no = shfi.iIcon;
    let index = d_no & 0x00FFFFFF;
    let sub_index = (d_no & 0x0F000000) >> 24;

    let hicon = ImageList_GetIcon(
      handle,
      index as i32,
      INDEXTOOVERLAYMASK(sub_index as u32) | ILD_NORMAL,
    );

    Some(AutoRelease {
      data: hicon,
      release_func: Box::new(|data| {
        DestroyIcon(*data);
      }),
    })
  }
}

fn icon_to_bitmap(h_icon: HICON) -> Option<AutoRelease<'static, HBITMAP>> {
  let icon_info = unsafe {
    let mut icon_info: ICONINFO = mem::zeroed();
    if GetIconInfo(h_icon, &mut icon_info as *mut ICONINFO) == 0 {
      return None;
    }
    AutoRelease {
      data: icon_info,
      release_func: Box::new(|data| {
        DeleteObject(data.hbmMask as *mut _);
        DeleteObject(data.hbmColor as *mut _);
      }),
    }
  };

  let bmp = unsafe {
    let mut bmp: BITMAP = mem::zeroed();
    let ret = GetObjectW(
      icon_info.data.hbmColor as *mut _,
      mem::size_of::<BITMAP>() as i32,
      &mut bmp as *mut BITMAP as *mut _,
    );
    if ret == 0 {
      return None;
    }
    bmp
  };

  unsafe {
    let hdc_screen = AutoRelease {
      data: GetDC(ptr::null_mut()),
      release_func: Box::new(|data| {
        ReleaseDC(ptr::null_mut(), *data);
      }),
    };

    let hdc_mem = AutoRelease {
      data: CreateCompatibleDC(hdc_screen.data),
      release_func: Box::new(|data| {
        DeleteDC(*data);
      }),
    };

    let h_bitmap = CreateCompatibleBitmap(hdc_screen.data, bmp.bmWidth, bmp.bmHeight);
    SelectObject(hdc_mem.data, h_bitmap as *mut _);
    PatBlt(hdc_mem.data, 0, 0, bmp.bmWidth, bmp.bmHeight, WHITENESS);

    let h_old_obj = SelectObject(hdc_mem.data, h_bitmap as *mut _);
    let ret = DrawIconEx(
      hdc_mem.data,
      0,
      0,
      h_icon,
      bmp.bmWidth,
      bmp.bmHeight,
      0,
      ptr::null_mut(),
      3,
    );
    SelectObject(hdc_mem.data, h_old_obj as *mut _);
    if ret == 0 {
      return None;
    }
    Some(AutoRelease {
      data: h_bitmap,
      release_func: Box::new(|data| {
        DeleteObject(*data as *mut _);
      }),
    })
  }
}

fn bitmap_to_bites(h_bitmap: HBITMAP) -> Option<Vec<u8>> {
  let bmp = unsafe {
    let mut bmp: BITMAP = mem::zeroed();
    let ret = GetObjectW(
      h_bitmap as *mut _,
      mem::size_of::<BITMAP>() as i32,
      &mut bmp as *mut BITMAP as *mut _,
    );
    if ret == 0 {
      return None;
    }
    bmp
  };

  let mut bmf_header: BITMAPFILEHEADER = unsafe { std::mem::zeroed() };
  bmf_header.bfType = 0x4D42; // "BM"
  bmf_header.bfSize = (std::mem::size_of::<BITMAPFILEHEADER>()
    + std::mem::size_of::<BITMAPINFOHEADER>()) as u32
    + (bmp.bmWidthBytes * bmp.bmHeight) as u32;
  bmf_header.bfOffBits =
    std::mem::size_of::<BITMAPFILEHEADER>() as u32 + std::mem::size_of::<BITMAPINFOHEADER>() as u32;

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
