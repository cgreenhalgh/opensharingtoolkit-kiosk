/**
 * 
 */
package org.opensharingtoolkit.kiosk;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.preference.PreferenceManager;
import android.util.Log;

/**
 * @author pszcmg
 *
 */
public class OnBootReceiver extends BroadcastReceiver {

	private static final String TAG = "kiosk-boot";

	/* (non-Javadoc)
	 * @see android.content.BroadcastReceiver#onReceive(android.content.Context, android.content.Intent)
	 */
	@Override
	public void onReceive(Context context, Intent intent) {
		// TODO Auto-generated method stub
		Log.d(TAG,"Boot received");
		try {
			SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(context);
			boolean onboot = spref.getBoolean("pref_kioskmodeonboot", false);
			if (onboot) {
				Log.i(TAG,"Set kiosk mode on boot");
				Editor e = spref.edit();
				e.putBoolean("pref_kioskmode", true);
				e.apply();
				
				Log.i(TAG,"Start kiosk on boot");
				Intent i = new Intent(context, MainActivity.class);
				i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
				context.startActivity(i);
			}
		} catch (Exception e) {
			Log.e(TAG,"Error setting kiosk mode on boot", e);
		}
	}

}
