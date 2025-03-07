# THIS FILE IS AUTO-GENERATED. DO NOT MODIFY!!

# Copyright 2020-2023 Tauri Programme within The Commons Conservancy
# SPDX-License-Identifier: Apache-2.0
# SPDX-License-Identifier: MIT

-keep class com.soulfiremc.soulfire.* {
  native <methods>;
}

-keep class com.soulfiremc.soulfire.WryActivity {
  public <init>(...);

  void setWebView(com.soulfiremc.soulfire.RustWebView);
  java.lang.Class getAppClass(...);
  java.lang.String getVersion();
}

-keep class com.soulfiremc.soulfire.Ipc {
  public <init>(...);

  @android.webkit.JavascriptInterface public <methods>;
}

-keep class com.soulfiremc.soulfire.RustWebView {
  public <init>(...);

  void loadUrlMainThread(...);
  void loadHTMLMainThread(...);
  void setAutoPlay(...);
  void setUserAgent(...);
  void evalScript(...);
}

-keep class com.soulfiremc.soulfire.RustWebChromeClient,com.soulfiremc.soulfire.RustWebViewClient {
  public <init>(...);
}