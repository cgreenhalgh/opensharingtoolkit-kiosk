package org.opensharingtoolkit.kiosk;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
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


	@Override
	protected void onResume() {
		super.onResume();
		// try to start OST chooser app
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

}
