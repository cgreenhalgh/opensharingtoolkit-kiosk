/**
 * 
 */
package org.opensharingtoolkit.logging;

import android.app.IntentService;
import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.util.Log;

/**
 * @author pszcmg
 *
 */
public class LoggingService extends IntentService {
	
	private static final int LEVEL_DEBUG = 2;

	public LoggingService() {
		super("OSTLogging");
	}

	public static String TAG = "logging";
	
	/* (non-Javadoc)
	 * @see android.app.Service#onBind(android.content.Intent)
	 */
	@Override
	public IBinder onBind(Intent arg0) {
		// no bind interface, at least for now
		return null;
	}

	/* (non-Javadoc)
	 * @see android.app.Service#onCreate()
	 */
	@Override
	public void onCreate() {
		Log.i(TAG,"Start LoggingService");
		super.onCreate();
	}

	/* (non-Javadoc)
	 * @see android.app.Service#onDestroy()
	 */
	@Override
	public void onDestroy() {
		Log.i(TAG,"Destroy LoggingService");
		super.onDestroy();
	}

	@Override
	protected void onHandleIntent(Intent intent) {
		//if (intent.getAction()=="org.opensharingtoolkit.intent.action.LOG") {
			long now = System.currentTimeMillis();
			long time = intent.getLongExtra("time", now);
			String component = intent.getStringExtra("component");
			String event = intent.getStringExtra("event");
			String info = intent.getStringExtra("info");
			int level = intent.getIntExtra("level", LEVEL_DEBUG);
			
			// TODO persist!
			Log.d(TAG,"Log: "+time+" "+level+" "+component+" "+event+" "+info);
		//}
	}

}
