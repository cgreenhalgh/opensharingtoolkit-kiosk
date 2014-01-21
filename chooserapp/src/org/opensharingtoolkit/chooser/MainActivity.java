package org.opensharingtoolkit.chooser;

import android.annotation.SuppressLint;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.os.PowerManager;
import android.os.PowerManager.WakeLock;
import android.util.Log;
import android.view.KeyEvent;
import android.view.WindowManager;

public class MainActivity extends BrowserActivity {

	@Override
	@SuppressLint("SetJavaScriptEnabled")
	protected void onCreate(Bundle savedInstanceState) {
		// make sure service is running...
		startService(new Intent(getApplicationContext(), Service.class));
		
		// TODO Auto-generated method stub
		super.onCreate(savedInstanceState);	
		
        // keep screen on (if possible) 
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        // This seems to be specific to CyanogenMod:
        // getWindow().addFlags(WindowManager.LayoutParams.PREVENT_POWER_KEY);
        
        // catch screen off
        // see http://stackoverflow.com/questions/9886466/overriding-the-power-button-in-android
        mScreenReceiver = new ScreenReceiver();
        final IntentFilter filter = new IntentFilter(Intent.ACTION_SCREEN_OFF);
        registerReceiver(mScreenReceiver, filter);
	}
	
	@Override
	protected void onDestroy() {
		unregisterReceiver(mScreenReceiver);
		finishWakeLocker();
		super.onDestroy();
	}
	
	private long mStopTime;
	@Override
	protected void onPause() {
		mStopTime = System.currentTimeMillis();
		super.onPause();
	}

	@Override
	protected void onResume() {
		super.onResume();
		mStopTime = 0;
		finishWakeLocker();
	}



	private WakeLock mWakeLock;
	
	class ScreenReceiver extends BroadcastReceiver {

		@Override
		public void onReceive(Context context, Intent intent) {
			if ((intent.getAction().equals(Intent.ACTION_SCREEN_OFF))) {
				Log.w(TAG,"ACTION_SCREEN_OFF");

				long now = System.currentTimeMillis();
				if (mStopTime==0 || now-mStopTime < 1000) {
					Log.w(TAG,"Try to restart...");
					PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
					if (mWakeLock==null)
						mWakeLock = pm.newWakeLock(PowerManager.SCREEN_DIM_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE, "TEST");
					mWakeLock.acquire();
				
					AlarmManager alarmMgr = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
					Intent inten = new Intent(context,MainActivity.class);
					PendingIntent pi = PendingIntent.getActivity(context, 0, inten, 0);
					alarmMgr.set(AlarmManager.ELAPSED_REALTIME_WAKEUP,  100, pi);
				}
			}
		}   
	}	
	// Finish your WakeLock HERE. call this method after U put the activity in front or when u exit from the new activity.
	private void finishWakeLocker(){
		if (mWakeLock != null) {
			mWakeLock.release();
			mWakeLock = null;
		}
	}
	
	private ScreenReceiver mScreenReceiver;
	
	@Override
	protected boolean handleBackPressed() {
		if (!super.handleBackPressed())
			// always 'handled'?? leave to kiosk??
			Log.w(TAG,"ignoring Back");
		return true;
	}
	@Override
	public boolean onKeyDown(int keyCode, KeyEvent event) {
	    if (keyCode == KeyEvent.KEYCODE_POWER) {
	        // Do something here...
	    	Log.w(TAG,"POWER KeyDown ignored");
	        return true;
	    }
	    return super.onKeyDown(keyCode, event);
	}

	@Override
	public boolean onKeyLongPress(int keyCode, KeyEvent event) {
	    if (keyCode == KeyEvent.KEYCODE_POWER) {
	        // Do something here...
	    	Log.w(TAG,"POWER KeyLongPress ignored");
	        return true;
	    }
	    return super.onKeyLongPress(keyCode, event);
	}
}
