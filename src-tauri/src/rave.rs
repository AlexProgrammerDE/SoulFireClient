use crate::sf_version_constant::SOULFIRE_VERSION;
use crate::utils::SFAnyError;
use serde_json::{Value, json};
use std::time::Duration;
 
const RAVE_API_BASE: &str = "https://api.ravealts.com";
 
fn rave_user_agent() -> String {
    format!("SoulFire/{}", SOULFIRE_VERSION)
}
 
fn truncate_string(s: &str, max_len: usize) -> String {
    if s.len() <= max_len {
        return s.to_string();
    }
    format!("{}...", &s[..max_len])
}
 
async fn rave_response_json(resp: reqwest::Response) -> Result<Value, SFAnyError> {
    let status = resp.status();
    let text = resp.text().await?;
 
    if let Ok(value) = serde_json::from_str::<Value>(&text) {
        return Ok(value);
    }
 
    Ok(json!({
        "status": "error",
        "message": format!(
            "Unexpected response from Rave Alts (HTTP {}): {}",
            status.as_u16(),
            truncate_string(&text, 500),
        ),
    }))
}
 
#[tauri::command]
pub async fn rave_stock() -> Result<Value, SFAnyError> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(20))
        .build()?;
 
    let resp = client
        .get(format!("{}/alts/stock", RAVE_API_BASE))
        .header(reqwest::header::USER_AGENT, rave_user_agent())
        .send()
        .await?;
 
    rave_response_json(resp).await
}
 
#[tauri::command]
pub async fn rave_key_info(api_key: String) -> Result<Value, SFAnyError> {
    let api_key = api_key.trim().to_string();
 
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(20))
        .build()?;
 
    let resp = client
        .get(format!("{}/alts/key-info", RAVE_API_BASE))
        .header(reqwest::header::USER_AGENT, rave_user_agent())
        .header(reqwest::header::AUTHORIZATION, format!("Bearer {}", api_key))
        .send()
        .await?;
 
    rave_response_json(resp).await
}
 
#[tauri::command]
pub async fn rave_purchase(
    api_key: String,
    account_type: String,
    amount: u32,
) -> Result<Value, SFAnyError> {
    let api_key = api_key.trim().to_string();
 
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()?;
 
    let resp = client
        .post(format!("{}/alts/purchase", RAVE_API_BASE))
        .header(reqwest::header::USER_AGENT, rave_user_agent())
        .header(reqwest::header::AUTHORIZATION, format!("Bearer {}", api_key))
        .json(&json!({
            "user_request": {
                "account_type": account_type,
                "amount": amount,
            }
        }))
        .send()
        .await?;
 
    rave_response_json(resp).await
}
