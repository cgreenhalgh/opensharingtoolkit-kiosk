/**
 * 
 */
package org.opensharingtoolkit.hotspot;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.util.Log;

/**
 * @author pszcmg
 *
 */
public class HotspotService extends Service {

	private static final String TAG = "ost-hotspot";

	/* (non-Javadoc)
	 * @see android.app.Service#onBind(android.content.Intent)
	 */
	@Override
	public IBinder onBind(Intent intent) {
		// implement if required... (not for now)
		return null;
	}

	@Override
	public void onCreate() {
		super.onCreate();
		Log.d(TAG,"Created HotspotService");
	}

	@Override
	public void onDestroy() {
		super.onDestroy();
		Log.d(TAG,"Destroy HotspotService");
	}

	@Override
	public int onStartCommand(Intent intent, int flags, int startId) {
		Log.d(TAG,"Start: "+intent.getAction());
		// dummy test action
		/*ExecTask t = new ExecTask() {
			@Override
			protected void onPostExecute(ExecResult result) {
				Log.d(TAG,"Done task (pwd): "+result);
			}			
		};
		t.execute("/system/bin/pwd");*/
		ExecTask t = new ExecTask() {
			@Override
			protected void onPostExecute(ExecResult result) {
				Log.d(TAG,"Done task (iptables): "+result);
			}			
		};
		t.execute("su","-c","/system/bin/iptables -L -t nat");
	
		  
		return START_STICKY;
	}

}
