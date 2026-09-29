use std::fs;
use std::path::{Path, PathBuf};
use tauri::Emitter;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn read_vault_files(path: String) -> Result<Vec<String>, String> {
    let dir = Path::new(&path);
    if !dir.is_dir() {
        return Err("Provided path is not a directory".to_string());
    }

    let mut md_files = Vec::new();

    fn scan_dir(dir: &Path, base_dir: &Path, files: &mut Vec<String>) -> Result<(), std::io::Error> {
        if dir.is_dir() {
            for entry in fs::read_dir(dir)? {
                let entry = entry?;
                let path = entry.path();

                // Skip hidden files/directories (like .obsidian, .git)
                if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                    if name.starts_with('.') {
                        continue;
                    }
                }

                if path.is_dir() {
                    scan_dir(&path, base_dir, files)?;
                } else if path.is_file() {
                    if let Some(ext) = path.extension() {
                        if ext == "md" {
                            if let Ok(rel_path) = path.strip_prefix(base_dir) {
                                if let Some(rel_str) = rel_path.to_str() {
                                    files.push(rel_str.replace('\\', "/"));
                                }
                            } else {
                                if let Some(filename) = path.file_name().and_then(|f| f.to_str()) {
                                    files.push(filename.to_string());
                                }
                            }
                        }
                    }
                }
            }
        }
        Ok(())
    }

    scan_dir(dir, dir, &mut md_files)
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    // Sort files alphabetically
    md_files.sort();

    Ok(md_files)
}

#[tauri::command]
async fn move_file(vault_path: String, old_rel_path: String, new_rel_path: String) -> Result<Vec<String>, String> {
    let base = Path::new(&vault_path);
    let old_path = base.join(&old_rel_path);
    
    let filename = old_path.file_name()
        .ok_or_else(|| "Invalid source filename".to_string())?;
    
    let new_dir = base.join(&new_rel_path);
    let new_path = new_dir.join(filename);
    
    if !new_dir.exists() && !new_rel_path.is_empty() {
        fs::create_dir_all(&new_dir)
            .map_err(|e| format!("Failed to create destination directory: {}", e))?;
    }
    
    fs::rename(&old_path, &new_path)
        .map_err(|e| format!("Failed to move file: {}", e))?;
        
    read_vault_files(vault_path).await
}

#[tauri::command]
async fn create_file(
    vault_path: String, 
    rel_path: String, 
    initial_content: Option<String>
) -> Result<Vec<String>, String> {
    let base = Path::new(&vault_path);
    let file_path = base.join(&rel_path);
    
    if let Some(parent) = file_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create parent directory: {}", e))?;
        }
    }
    
    if file_path.exists() {
        return Err("File already exists".to_string());
    }
    
    let content_to_write = if let Some(content) = initial_content {
        content
    } else if rel_path.ends_with(".canvas") {
        "{\n  \"nodes\": [],\n  \"edges\": []\n}".to_string()
    } else {
        let filename = file_path.file_name()
            .and_then(|f| f.to_str())
            .unwrap_or("Untitled.md");
        let title = filename.strip_suffix(".md").unwrap_or(filename);
        
        let is_date = title.len() == 10 
            && title.chars().enumerate().all(|(i, c)| if i == 4 || i == 7 { c == '-' } else { c.is_ascii_digit() });

        if is_date {
            String::new()
        } else {
            format!("# {}\n\n", title)
        }
    };

    fs::write(&file_path, content_to_write)
        .map_err(|e| format!("Failed to create file: {}", e))?;
        
    read_vault_files(vault_path).await
}

#[tauri::command]
async fn read_file_content(vault_path: String, rel_path: String) -> Result<String, String> {
    let base = Path::new(&vault_path);
    let file_path = base.join(&rel_path);
    
    fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
async fn write_file_content(vault_path: String, rel_path: String, content: String) -> Result<(), String> {
    let base = Path::new(&vault_path);
    let file_path = base.join(&rel_path);
    
    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write file: {}", e))
}

use std::collections::HashMap;

fn get_vault_image_index(base: &Path) -> HashMap<String, PathBuf> {
    let mut index = HashMap::new();
    fn scan(dir: &Path, map: &mut HashMap<String, PathBuf>) {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                        let lower = name.to_lowercase();
                        if lower.starts_with('.') || lower == "node_modules" || lower == "target" || lower == "dist" || lower == "build" {
                            continue;
                        }
                    }
                    scan(&path, map);
                } else if path.is_file() {
                    if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                        let lower = name.to_lowercase();
                        map.insert(lower, path);
                    }
                }
            }
        }
    }
    scan(base, &mut index);
    index
}

fn load_single_image_b64(img_path: &Path) -> Result<String, String> {
    let bytes = fs::read(img_path).map_err(|e| format!("Failed to read image file: {}", e))?;
    let ext = img_path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
    let mime = match ext.as_str() {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        _ => "application/octet-stream",
    };
    use base64::{Engine as _, engine::general_purpose};
    let b64 = general_purpose::STANDARD.encode(&bytes);
    Ok(format!("data:{};base64,{}", mime, b64))
}

#[tauri::command]
async fn resolve_image_path(
    vault_path: String,
    note_path: Option<String>,
    img_ref: String,
    custom_images_path: Option<String>,
) -> Result<String, String> {
    #[cfg(debug_assertions)]
    eprintln!(
        "[IMAGE RUST INPUT] vault_path={:?}, note_path={:?}, image_reference={:?}",
        vault_path,
        note_path,
        img_ref
    );

    let vault_dir = match fs::canonicalize(Path::new(&vault_path)) {
        Ok(p) => p,
        Err(_) => PathBuf::from(&vault_path),
    };

    if !vault_dir.is_dir() {
        return Err("Provided vault path is not a directory".to_string());
    }

    let mut clean_ref = img_ref.trim().to_string();
    if let Ok(decoded) = urlencoding::decode(&clean_ref) {
        clean_ref = decoded.into_owned();
    }
    if clean_ref.starts_with("file:///") {
        clean_ref = clean_ref.trim_start_matches("file:///").to_string();
    } else if clean_ref.starts_with("file://") {
        clean_ref = clean_ref.trim_start_matches("file://").to_string();
    }

    let clean_ref_path = Path::new(&clean_ref);

    // Determine current note directory
    let note_dir = if let Some(ref np) = note_path {
        let np_path = Path::new(np);
        let abs_note_path = if np_path.is_absolute() {
            np_path.to_path_buf()
        } else {
            vault_dir.join(np_path)
        };
        abs_note_path.parent().map(|p| p.to_path_buf()).unwrap_or_else(|| vault_dir.clone())
    } else {
        vault_dir.clone()
    };

    let filename_only = clean_ref_path.file_name().and_then(|f| f.to_str()).unwrap_or(&clean_ref);

    let candidates = vec![
        note_dir.join(&clean_ref),
        vault_dir.join(&clean_ref),
        note_dir.join("img").join(&clean_ref),
        vault_dir.join("img").join(&clean_ref),
        note_dir.join(filename_only),
        vault_dir.join(filename_only),
        note_dir.join("img").join(filename_only),
        vault_dir.join("img").join(filename_only),
    ];

    #[cfg(debug_assertions)]
    for cand in &candidates {
        eprintln!(
            "[IMAGE RUST CANDIDATE] path={} exists={} is_file={}",
            cand.display(),
            cand.exists(),
            cand.is_file()
        );
    }

    let mut found: Option<PathBuf> = None;

    for cand in candidates {
        if cand.is_file() {
            found = Some(cand);
            break;
        }
    }

    if found.is_none() {
        if let Some(ref cip) = custom_images_path {
            if !cip.trim().is_empty() {
                let cip_dir = Path::new(cip);
                let cip_cand = cip_dir.join(&clean_ref);
                let cip_file = cip_dir.join(filename_only);
                if cip_cand.is_file() {
                    found = Some(cip_cand);
                } else if cip_file.is_file() {
                    found = Some(cip_file);
                }
            }
        }
    }

    // Fallback: index lookup by filename
    if found.is_none() {
        let index = get_vault_image_index(&vault_dir);
        let lookup_key = filename_only.to_lowercase();
        if let Some(indexed_path) = index.get(&lookup_key) {
            found = Some(indexed_path.clone());
        }
    }

    let target_file = match found {
        Some(p) => match fs::canonicalize(&p) {
            Ok(cp) => cp,
            Err(_) => p,
        },
        None => return Err(format!("File '{}' not found in vault", img_ref)),
    };

    // Security check: ensure target_file is within vault_dir, note_dir, or allowed custom_images_path
    let allowed_custom = custom_images_path.as_ref().and_then(|p| fs::canonicalize(Path::new(p)).ok());
    
    let is_inside_vault = target_file.starts_with(&vault_dir);
    let is_inside_custom = allowed_custom.as_ref().map(|c| target_file.starts_with(c)).unwrap_or(false);

    if !is_inside_vault && !is_inside_custom {
        return Err("Access denied: File is outside allowed vault directory".to_string());
    }

    let path_str = target_file.to_string_lossy().to_string();
    let clean_abs_path = if path_str.starts_with(r"\\?\") {
        path_str[4..].to_string()
    } else {
        path_str
    };

    Ok(clean_abs_path)
}

#[tauri::command]
async fn load_note_image_bytes(
    vault_path: String,
    note_path: Option<String>,
    img_ref: String,
    custom_images_path: Option<String>,
) -> Result<tauri::ipc::Response, String> {
    let resolved_abs = resolve_image_path(vault_path, note_path, img_ref, custom_images_path).await?;
    let bytes = fs::read(&resolved_abs).map_err(|e| format!("Failed to read image file: {}", e))?;
    
    #[cfg(debug_assertions)]
    eprintln!(
        "[IMAGE RUST FOUND] path={} bytes={}",
        resolved_abs,
        bytes.len()
    );

    #[cfg(debug_assertions)]
    eprintln!(
        "[IMAGE RUST RETURN] {} bytes",
        bytes.len()
    );

    Ok(tauri::ipc::Response::new(bytes))
}

#[tauri::command]
async fn read_images_batch(
    vault_path: String,
    filenames: Vec<String>,
    custom_images_path: Option<String>,
) -> Result<HashMap<String, String>, String> {
    let base = Path::new(&vault_path);
    if !base.is_dir() {
        return Err("Provided path is not a directory".to_string());
    }

    if filenames.is_empty() {
        return Ok(HashMap::new());
    }

    let mut results = HashMap::new();
    let mut missing = Vec::new();

    let custom_dir = custom_images_path.as_ref().map(|p| Path::new(p));

    // 1. Fast direct checks
    for filename in filenames {
        let mut clean_filename = filename.replace("%20", " ");
        if clean_filename.starts_with("file:///") {
            clean_filename = clean_filename.trim_start_matches("file:///").to_string();
        } else if clean_filename.starts_with("file://") {
            clean_filename = clean_filename.trim_start_matches("file://").to_string();
        }

        let abs_path = Path::new(&clean_filename);
        let custom_file = custom_dir.map(|d| d.join(&clean_filename));
        let img_dir = base.join("img").join(&clean_filename);
        let direct = base.join(&clean_filename);
        let images_dir = base.join("images").join(&clean_filename);
        let attachments = base.join("attachments").join(&clean_filename);
        let assets = base.join("assets").join(&clean_filename);
        let media = base.join("media").join(&clean_filename);
        let resources = base.join("resources").join(&clean_filename);

        let found_path = if abs_path.is_file() {
            Some(abs_path.to_path_buf())
        } else if let Some(ref c_path) = custom_file {
            if c_path.is_file() {
                Some(c_path.clone())
            } else if img_dir.is_file() {
                Some(img_dir)
            } else if direct.is_file() {
                Some(direct)
            } else if images_dir.is_file() {
                Some(images_dir)
            } else if attachments.is_file() {
                Some(attachments)
            } else if assets.is_file() {
                Some(assets)
            } else if media.is_file() {
                Some(media)
            } else if resources.is_file() {
                Some(resources)
            } else {
                None
            }
        } else if img_dir.is_file() {
            Some(img_dir)
        } else if direct.is_file() {
            Some(direct)
        } else if images_dir.is_file() {
            Some(images_dir)
        } else if attachments.is_file() {
            Some(attachments)
        } else if assets.is_file() {
            Some(assets)
        } else if media.is_file() {
            Some(media)
        } else if resources.is_file() {
            Some(resources)
        } else {
            None
        };

        if let Some(img_path) = found_path {
            if let Ok(data_url) = load_single_image_b64(&img_path) {
                results.insert(filename, data_url);
            } else {
                results.insert(filename, "failed: read error".to_string());
            }
        } else {
            missing.push((filename, clean_filename));
        }
    }

    // 2. Slow path for nested subfolders only if missing from standard paths
    if !missing.is_empty() {
        let index = get_vault_image_index(base);
        for (orig_filename, clean_filename) in missing {
            let lookup_key = clean_filename.to_lowercase();
            if let Some(img_path) = index.get(&lookup_key) {
                if let Ok(data_url) = load_single_image_b64(img_path) {
                    results.insert(orig_filename, data_url);
                } else {
                    results.insert(orig_filename, "failed: read error".to_string());
                }
            } else {
                results.insert(orig_filename, "failed: not found".to_string());
            }
        }
    }

    Ok(results)
}

#[tauri::command]
async fn read_image_base64(vault_path: String, filename: String) -> Result<String, String> {
    let base = Path::new(&vault_path);
    if !base.is_dir() {
        return Err("Provided path is not a directory".to_string());
    }

    let direct = base.join(&filename);
    let attachments = base.join("attachments").join(&filename);
    let assets = base.join("assets").join(&filename);
    let media = base.join("media").join(&filename);

    let target_path = if direct.is_file() {
        Some(direct)
    } else if attachments.is_file() {
        Some(attachments)
    } else if assets.is_file() {
        Some(assets)
    } else if media.is_file() {
        Some(media)
    } else {
        let index = get_vault_image_index(base);
        let lookup_key = filename.to_lowercase();
        index.get(&lookup_key).cloned()
    }.ok_or_else(|| format!("File '{}' not found in vault", filename))?;

    load_single_image_b64(&target_path)
}

#[tauri::command]
async fn delete_file(vault_path: String, rel_path: String) -> Result<Vec<String>, String> {
    let base = Path::new(&vault_path);
    let file_path = base.join(&rel_path);
    
    if file_path.exists() {
        if file_path.is_file() {
            fs::remove_file(&file_path)
                .map_err(|e| format!("Failed to delete file: {}", e))?;
        } else if file_path.is_dir() {
            fs::remove_dir_all(&file_path)
                .map_err(|e| format!("Failed to delete folder: {}", e))?;
        }
    }
    
    read_vault_files(vault_path).await
}

#[tauri::command]
async fn rename_file(vault_path: String, old_rel_path: String, new_rel_path: String) -> Result<Vec<String>, String> {
    let base = Path::new(&vault_path);
    let old_path = base.join(&old_rel_path);
    let new_path = base.join(&new_rel_path);
    
    if !old_path.exists() {
        return Err("Source file does not exist".to_string());
    }
    if new_path.exists() {
        return Err("Destination already exists".to_string());
    }
    
    fs::rename(&old_path, &new_path)
        .map_err(|e| format!("Failed to rename file: {}", e))?;
        
    read_vault_files(vault_path).await
}

#[tauri::command]
fn show_in_explorer(vault_path: String, rel_path: String) -> Result<(), String> {
    let base = Path::new(&vault_path);
    let file_path = base.join(&rel_path);
    
    if !file_path.exists() {
        return Err("File or folder does not exist".to_string());
    }
    
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        let mut cmd = Command::new("explorer.exe");
        if file_path.is_file() {
            cmd.arg("/select,").arg(file_path);
        } else {
            cmd.arg(file_path);
        }
        cmd.spawn().map_err(|e| format!("Failed to open explorer: {}", e))?;
    }
    
    Ok(())
}

#[tauri::command]
async fn create_directory(vault_path: String, rel_path: String) -> Result<Vec<String>, String> {
    let base = Path::new(&vault_path);
    let dir_path = base.join(&rel_path);
    
    if dir_path.exists() {
        return Err("Folder already exists".to_string());
    }
    
    fs::create_dir_all(&dir_path)
        .map_err(|e| format!("Failed to create folder: {}", e))?;
        
    read_vault_files(vault_path).await
}

#[tauri::command]
fn launch_game(path: String) -> Result<(), String> {
    let path = std::path::Path::new(&path);
    if !path.exists() {
        return Err("Указанный файл не существует. Пожалуйста, проверьте путь.".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        use std::os::windows::process::CommandExt;
        let parent_dir = path.parent().unwrap_or(path);
        let path_str = path.to_str().unwrap_or("");
        
        // Automatic redirection for VALORANT because launching VALORANT.exe directly fails without Riot Client parameters
        if path_str.to_lowercase().contains("valorant.exe") {
            let riot_client = std::path::Path::new(r"C:\Riot Games\Riot Client\RiotClientServices.exe");
            if riot_client.exists() {
                Command::new("cmd")
                    .creation_flags(0x08000000)
                    .args(&["/C", "start", "", riot_client.to_str().unwrap_or(""), "--launch-product=valorant", "--launch-patchline=live"])
                    .current_dir(parent_dir)
                    .spawn()
                    .map_err(|e| format!("Ошибка запуска VALORANT через Riot Client: {}", e))?;
                return Ok(());
            }
        }

        Command::new("cmd")
            .creation_flags(0x08000000)
            .args(&["/C", "start", "", path_str])
            .current_dir(parent_dir)
            .spawn()
            .map_err(|e| format!("Ошибка запуска процесса: {}", e))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        return Err("Запуск приложений поддерживается только на ОС Windows.".to_string());
    }

    Ok(())
}

#[tauri::command]
fn check_file_exists(path: String) -> bool {
    if path.trim().is_empty() {
        return false;
    }
    std::path::Path::new(&path).exists()
}

#[tauri::command]
fn is_game_running(path: String) -> bool {
    let path_buf = std::path::PathBuf::from(&path);
    let exe_name = match path_buf.file_name().and_then(|n| n.to_str()) {
        Some(name) => name,
        None => return false,
    };
    let base_name = exe_name.strip_suffix(".exe").unwrap_or(exe_name).to_lowercase();

    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        use std::os::windows::process::CommandExt;
        let output = Command::new("tasklist")
            .creation_flags(0x08000000)
            .arg("/NH")
            .output();
        if let Ok(out) = output {
            let stdout = String::from_utf8_lossy(&out.stdout).to_lowercase();
            stdout.contains(&base_name)
        } else {
            false
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        false
    }
}

#[tauri::command]
fn stop_game(path: String) -> Result<(), String> {
    let path_buf = std::path::PathBuf::from(&path);
    let exe_name = match path_buf.file_name().and_then(|n| n.to_str()) {
        Some(name) => name,
        None => return Err("Некорректное имя файла".to_string()),
    };

    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        use std::os::windows::process::CommandExt;

        let path_lower = path.to_lowercase();
        let mut targets = vec![exe_name];
        
        if path_lower.contains("genshin") {
            targets.push("GenshinImpact.exe");
        }

        for target in targets {
            let _ = Command::new("taskkill")
                .creation_flags(0x08000000)
                .args(&["/F", "/T", "/IM", target])
                .output();
        }

        if is_game_running(path.clone()) || (path_lower.contains("genshin") && is_game_running("GenshinImpact.exe".to_string())) {
            return Err("Не удалось закрыть игру. Возможно, она запущена от имени администратора. Запустите этот менеджер от имени администратора.".to_string());
        }
    }

    Ok(())
}

#[tauri::command]
fn get_game_icon(path: String) -> Result<String, String> {
    let path_buf = std::path::Path::new(&path);
    if !path_buf.exists() {
        return Err("Указанный файл не существует.".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        use std::os::windows::process::CommandExt;
        
        let script = format!(
            "Add-Type -AssemblyName System.Drawing; \
             $icon = [System.Drawing.Icon]::ExtractAssociatedIcon('{}'); \
             $bmp = $icon.ToBitmap(); \
             $ms = New-Object System.IO.MemoryStream; \
             $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); \
             $bytes = $ms.ToArray(); \
             $b64 = [Convert]::ToBase64String($bytes); \
             Write-Host -NoNewline $b64",
            path_buf.to_str().unwrap_or("").replace('\'', "''")
        );

        let output = Command::new("powershell")
            .creation_flags(0x08000000)
            .args(&["-NoProfile", "-Command", &script])
            .output()
            .map_err(|e| format!("Ошибка запуска PowerShell: {}", e))?;

        if output.status.success() {
            let base64_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if base64_str.is_empty() {
                return Err("Не удалось получить иконку приложения (пустой вывод).".to_string());
            }
            Ok(format!("data:image/png;base64,{}", base64_str))
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(format!("Ошибка PowerShell: {}", stderr))
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Получение иконки поддерживается только на ОС Windows.".to_string())
    }
}

#[tauri::command]
fn exit_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn open_url(app: tauri::AppHandle, url: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|e| format!("Ошибка открытия ссылки: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet, 
            read_vault_files, 
            move_file, 
            read_file_content, 
            write_file_content,
            read_image_base64,
            read_images_batch,
            resolve_image_path,
            load_note_image_bytes,
            exit_app,
            create_file,
            delete_file,
            rename_file,
            show_in_explorer,
            create_directory,
            launch_game,
            check_file_exists,
            is_game_running,
            stop_game,
            get_game_icon,
            open_url
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // We emit a payload requesting the frontend to save session
                let _ = window.emit("request-session-save", ());
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_find_image() {
        let vault = r"C:\Users\gospo\OneDrive\Документы\Obsid\Obsidian Vault";
        let file = "Pasted image 20260630171054.png";
        
        let base = Path::new(vault);
        println!("Base path is_dir: {}", base.is_dir());
        
        let mut target_path = None;
        
        // inline implementation of find_file to test it
        fn find_file_test(dir: &Path, filename: &str, found: &mut Option<PathBuf>) {
            if found.is_some() {
                return;
            }
            if let Ok(entries) = fs::read_dir(dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_dir() {
                        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                            if name.starts_with('.') {
                                continue;
                            }
                        }
                        find_file_test(&path, filename, found);
                    } else if path.is_file() {
                        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                            if name.to_lowercase() == filename.to_lowercase() {
                                *found = Some(path.to_path_buf());
                                return;
                            }
                        }
                    }
                }
            }
        }

        find_file_test(base, file, &mut target_path);
        
        println!("Target path found: {:?}", target_path);
        assert!(target_path.is_some(), "Image was not found!");
    }
}

