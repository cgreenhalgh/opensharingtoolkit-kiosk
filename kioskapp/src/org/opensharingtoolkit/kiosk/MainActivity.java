package org.opensharingtoolkit.kiosk;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Vector;

import org.apache.http.util.LangUtils;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;
import android.content.pm.PermissionInfo;
import android.content.pm.ResolveInfo;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.util.Log;

public class MainActivity extends Activity {

	
	
	private static final String TAG = "ost-kiosk";


	@Override
	protected void onCreate(Bundle savedInstanceState) {
		// TODO Auto-generated method stub
		super.onCreate(savedInstanceState);		
	}

	
	@Override
	public void onBackPressed() {
		// ignore
		Log.w(TAG,"ignoring Back");
	}

	private static Vector<Long> launchTimes = new Vector<Long>();
	private static final int LAUNCH_TIMES_N = 5;
	private static final long LAUNCH_TIMES_DELAY_MS = 5000;

	@Override
	protected void onResume() {
		super.onResume();
		// try to fix status bar
		fixStatusBar();
		// try to start OST chooser app
		long now= System.currentTimeMillis();
		launchTimes.add(now);
		if (launchTimes.size()>LAUNCH_TIMES_N)
			launchTimes.remove(0);
		if (launchTimes.size()>=LAUNCH_TIMES_N && now-launchTimes.get(0) < LAUNCH_TIMES_DELAY_MS) {
			Log.i(TAG,"quick press N - launch settings");
			try {
				Intent i = new Intent(this, SettingsActivity.class);
				Log.i(TAG,"Launching settings");
				startActivity(i);
			} 
			catch (Exception e) {
				Log.e(TAG,"Error launching settings: "+e);
			}			
		}
		else {
			SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(this);
			boolean kioskmode = spref.getBoolean("pref_kioskmode", true);

			if (kioskmode) {
				String pkg = getString(R.string.run_package);
				try {
					Intent i = getPackageManager().getLaunchIntentForPackage(pkg);
					Log.i(TAG,"Launching "+pkg);
					startActivity(i);
				} 
				catch (Exception e) {
					Log.e(TAG,"Error launching "+pkg+": may not be installed");
				}
			}
			else {
				Log.d(TAG,"Try to launch default home");
				Intent i = new Intent(); 
		        i.setAction(Intent.ACTION_MAIN); 
		        i.addCategory(Intent.CATEGORY_HOME); 
		        PackageManager pm = this.getPackageManager(); 
		        List<ResolveInfo> ris = pm.queryIntentActivities(i, PackageManager.MATCH_DEFAULT_ONLY);
		        for (ResolveInfo ri : ris) {
		        	if (ri.activityInfo.packageName==this.getPackageName()) {
		        		Log.d(TAG,"- ignore "+ri.activityInfo.name+" in "+ri.activityInfo.packageName);
		        		continue;
		        	}
		        	i.setPackage(ri.activityInfo.packageName);
		        	Log.d(TAG,"- trying package "+ri.activityInfo.packageName);
					try {
						startActivity(i);
						break;
					} 
					catch (Exception e) {
						Log.e(TAG,"Error launching MAIN in "+ri.activityInfo.packageName+": "+e);
					}
		        }
			}
		}
	}
	/** try to fix the status bar - only works as a system app */
	private void fixStatusBar() {
		// TODO Auto-generated method stub
		// check permission level
		// Get the permissions for the core android package
		PackageInfo packageInfo;
		try {
			packageInfo = getPackageManager().getPackageInfo("android", PackageManager.GET_PERMISSIONS);
			if (packageInfo.permissions != null) {
				// For each defined permission
				for (PermissionInfo permission : packageInfo.permissions) {
					if (!permission.name.contains("STATUS_BAR"))
						continue;
					// Dump permission info
					String protectionLevel;
					switch(permission.protectionLevel&PermissionInfo.PROTECTION_MASK_BASE) {
					case PermissionInfo.PROTECTION_NORMAL : protectionLevel = "normal"; break;
					case PermissionInfo.PROTECTION_DANGEROUS : protectionLevel = "dangerous"; break;
					case PermissionInfo.PROTECTION_SIGNATURE : protectionLevel = "signature"; break;
					case PermissionInfo.PROTECTION_SIGNATURE_OR_SYSTEM : protectionLevel = "signatureOrSystem"; break;
					default : protectionLevel = "<unknown>"; break;
					}
			        if ((permission.protectionLevel&PermissionInfo.PROTECTION_FLAG_SYSTEM) != 0) 
			        	protectionLevel += "|system";
			        if ((permission.protectionLevel&PermissionInfo.PROTECTION_FLAG_DEVELOPMENT) != 0) 
			        	protectionLevel += "|development";
					Log.i("PermissionCheck", permission.name + " " + protectionLevel+" ("+permission.protectionLevel+")");
				}
			}
		} catch (Exception e1) {
			Log.e(TAG,"Checking permissions: "+e1);
		}
		try {
            // Use reflection to trigger a method from 'StatusBarManager'                
            Object statusBarService = getSystemService("statusbar");
            Class<?> statusBarManager = null;
            statusBarManager = Class.forName("android.app.StatusBarManager");
            int DISABLE_MASK = statusBarManager.getField("DISABLE_MASK").getInt(null);
            int DISABLE_EXPAND = statusBarManager.getField("DISABLE_EXPAND").getInt(null);
            Method disable = statusBarManager.getMethod("disable", Integer.TYPE);
            disable.invoke(statusBarService, DISABLE_MASK);
            Log.d(TAG,"Requested disable status bar options");
		} catch (Exception e) {
			Log.e(TAG,"Error fixing status bar: "+e);
		}
	}

}
