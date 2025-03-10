package com.soulfiremc.soulfire;

import android.app.Activity
import app.tauri.annotation.Command
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject

@TauriPlugin
class SFMobilePlugin(private val activity: Activity): Plugin(activity) {
  private fun resolvePath(invoke: Invoke, path: String?) {
    val obj = JSObject()
    obj.put("path", path)
    invoke.resolve(obj)
  }

  @Command
  fun getNativeLibraryDir(invoke: Invoke) {
    resolvePath(invoke, activity.applicationInfo.nativeLibraryDir)
  }
}
