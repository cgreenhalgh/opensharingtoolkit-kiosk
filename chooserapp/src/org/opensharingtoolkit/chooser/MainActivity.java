package org.opensharingtoolkit.chooser;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import android.annotation.SuppressLint;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.ServiceConnection;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.PowerManager.WakeLock;
import android.preference.PreferenceManager;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;

import org.opensharingtoolkit.common.Recorder;

public class MainActivity extends BrowserActivity implements ServiceConnection {
	
	public MainActivity() {
		super("chooser.main");
	}
	
	@Override
	@SuppressLint("SetJavaScriptEnabled")
	protected void onCreate(Bundle savedInstanceState) {
		// TODO Auto-generated method stub
		super.onCreate(savedInstanceState);	

		// make sure service is running...
		Intent serviceIntent = new Intent(getApplicationContext(), Service.class);
		startService(serviceIntent);
		bindService(serviceIntent, this, Context.BIND_AUTO_CREATE);
		
		SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(MainActivity.this);
		if (spref.getBoolean("pref_landscape", false)) {
			if (getRequestedOrientation()!=ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE)
				setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
		} else {
			if (getRequestedOrientation()!=ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED)
				setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
		}
		if (spref.getBoolean("pref_fullscreen", false)) {
			getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);
		}
        // This seems to be specific to CyanogenMod:
        // getWindow().addFlags(WindowManager.LayoutParams.PREVENT_POWER_KEY);
        
        // catch screen off
        // see http://stackoverflow.com/questions/9886466/overriding-the-power-button-in-android
        mScreenReceiver = new ScreenReceiver();
        final IntentFilter filter = new IntentFilter(Intent.ACTION_SCREEN_OFF);
        registerReceiver(mScreenReceiver, filter);
        
        handleIntent(getIntent());
	}
	
	@Override
	protected void onDestroy() {
		unregisterReceiver(mScreenReceiver);
		finishWakeLocker();
		unbindService(this);
		super.onDestroy();
	}
	
	private long mStopTime;
	@Override
	protected void onPause() {
		mRecorder.i("activity.pause", null);
		mStopTime = System.currentTimeMillis();
		super.onPause();
	    // Activity's been paused      
	    //isPaused = true;
	}

    
    // http://stackoverflow.com/questions/7821584/error-using-statusbarmanagerservice-java-lang-securityexception-on-android-per
	// tried (below) but doesn't seem to help at all on 4.4.2
	// See also http://e2e.ti.com/support/embedded/android/f/509/t/283260.aspx
    //   mStatusBarManager = (StatusBarManager) appGetSystemService(Context.STATUS_BAR_SERVICE);
    //   mStatusBarManager.disable(StatusBarManager.DISABLE_EXPAND)
    // Hmm, but see
	//   http://stackoverflow.com/questions/19920052/disable-the-notification-panel-from-being-pulled-down
	// Probably need a custom status bar or something like that installed as part of the OS
	/*
	// To keep track of activity's foreground/background status
	private boolean isPaused;
	// To keep track of activity's window focus
	private boolean currentFocus;


	private Handler collapseNotificationHandler;
	
	@Override
	// See http://stackoverflow.com/questions/19920052/disable-the-notification-panel-from-being-pulled-down
	public void onWindowFocusChanged(boolean hasFocus) {
	    currentFocus = hasFocus;
	    if (!hasFocus) {
	        // Method that handles loss of window focus
	        collapseNow();
	    }
	}
	// See http://stackoverflow.com/questions/19920052/disable-the-notification-panel-from-being-pulled-down
	public void collapseNow() {
	    // Initialize 'collapseNotificationHandler'
	    if (collapseNotificationHandler == null) {
	        collapseNotificationHandler = new Handler();
	    }
	    // If window focus has been lost && activity is not in a paused state
	    // Its a valid check because showing of notification panel
	    // steals the focus from current activity's window, but does not 
	    // 'pause' the activity
	    if (!currentFocus && !isPaused) {
	        // Post a Runnable with some delay - currently set to 300 ms
	        collapseNotificationHandler.postDelayed(new Runnable() {
	            @Override
	            public void run() {
	                // Use reflection to trigger a method from 'StatusBarManager'                
	                Object statusBarService = getSystemService("statusbar");
	                Class<?> statusBarManager = null;
	                try {
	                    statusBarManager = Class.forName("android.app.StatusBarManager");
		                Method collapseStatusBar = null;
		                try {
		                    // Prior to API 17, the method to call is 'collapse()'
		                    // API 17 onwards, the method to call is `collapsePanels()`
		                    if (Build.VERSION.SDK_INT > 16) {
		                        collapseStatusBar = statusBarManager.getMethod("collapsePanels");
		                    } else {
		                        collapseStatusBar = statusBarManager.getMethod("collapse");
		                    }
		                    collapseStatusBar.setAccessible(true);

			                try {
			                    collapseStatusBar.invoke(statusBarService);
			                    Log.d(TAG,"Requested collapse status bar");
				                // Check if the window focus has been returned
				                // If it hasn't been returned, post this Runnable again
				                // Currently, the delay is 100 ms. You can change this
				                // value to suit your needs.
				                if (!currentFocus && !isPaused) {
				                    collapseNotificationHandler.postDelayed(this, 100L);
				                }
			                } catch (Exception e) {
			                	Log.w(TAG,"Error inoking collapse method", e);
			                }
		                } catch (NoSuchMethodException e) {
		                    Log.e(TAG,"Error getting collapsePanels/collapse", e);
		                }
	                } catch (ClassNotFoundException e) {
	                    Log.e(TAG,"Error getting StatusBarManager", e);
	                }
	            }
	        }, 300L);
	    }   
	}
	*/
	@Override
	protected void onResume() {
		mRecorder.i("activity.resume", null);
		super.onResume();

		SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(MainActivity.this);
		if (spref.getBoolean("pref_keepscreenon", false)) {
			Log.d(TAG,"resume: keepscreenon");
			// keep screen on (if possible) 
			getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
			getWindow().addFlags(WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
		} else {
			Log.d(TAG,"resume: NOT keepscreenon");
			getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
			getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);			
		}
		if (spref.getBoolean("pref_landscape", false)) {
			if (getRequestedOrientation()!=ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE)
				setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
		} else {
			if (getRequestedOrientation()!=ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED)
				setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
		}
		if (spref.getBoolean("pref_fullscreen", false)) {
			Log.d(TAG,"resume: fullscreen");
			getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);
			// hide notification??
			View decorView = getWindow().getDecorView();
			int uiOptions = View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_STABLE;
			decorView.setSystemUiVisibility(uiOptions);
		} else {
			getWindow().setFlags(0, WindowManager.LayoutParams.FLAG_FULLSCREEN);
		}
		mStopTime = 0;
		finishWakeLocker();
	    // Activity's been resumed
	    //isPaused = false;
	}


	private WakeLock mWakeLock;
	
	class ScreenReceiver extends BroadcastReceiver {

		@Override
		public void onReceive(Context context, Intent intent) {
			if ((intent.getAction().equals(Intent.ACTION_SCREEN_OFF))) {
				Log.w(TAG,"ACTION_SCREEN_OFF");
				mRecorder.i("device.screenOff", null);
				
				SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(MainActivity.this);
				long now = System.currentTimeMillis();
				if (spref.getBoolean("pref_keepscreenon", false) && (mStopTime==0 || now-mStopTime < 1000)) {
					Log.w(TAG,"Try to restart (keepscreenon)...");
					mRecorder.i("app.tryWake", null);
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
			mRecorder.d("app.releaseWakeLock", null);

			mWakeLock.release();
			mWakeLock = null;
		}
	}
	
	private ScreenReceiver mScreenReceiver;
	
	@Override
	protected boolean handleBackPressed() {
		if (!super.handleBackPressed()) {
			// always 'handled'?? leave to kiosk??
			Log.w(TAG,"ignoring Back");
			mRecorder.i("user.key.back", null);
		}
		return true;
	}
	@Override
	public boolean onKeyDown(int keyCode, KeyEvent event) {
	    if (keyCode == KeyEvent.KEYCODE_POWER) {
	        // Do something here...
	    	Log.w(TAG,"POWER KeyDown ignored");
			mRecorder.i("user.key.power.down", null);
	        return true;
	    }
	    return super.onKeyDown(keyCode, event);
	}

	@Override
	public boolean onKeyLongPress(int keyCode, KeyEvent event) {
	    if (keyCode == KeyEvent.KEYCODE_POWER) {
	        // Do something here...
	    	Log.w(TAG,"POWER KeyLongPress ignored");
			mRecorder.i("user.key.power.longPress", null);
	        return true;
	    }
	    return super.onKeyLongPress(keyCode, event);
	}
	/* (non-Javadoc)
	 * @see android.app.Activity#onNewIntent(android.content.Intent)
	 */
	@Override
	protected void onNewIntent(Intent intent) {
		handleIntent(intent);
		super.onNewIntent(intent);
	}

	public static final String ACTION_SET_BRIGHTNESS = "org.opensharingtoolkit.chooser.setBrightness";
	public static final String ACTION_FINISH = "org.opensharingtoolkit.chooser.FINISH";
	public static final String EXTRA_BRIGHTNESS = "brightness";
	
	private void handleIntent(Intent intent) {
		Log.d(TAG,"handleIntent "+intent.getAction());
		if (ACTION_SET_BRIGHTNESS.equals(intent.getAction())) {
			try {
				WindowManager.LayoutParams layout = getWindow().getAttributes();
				layout.screenBrightness = intent.getFloatExtra(EXTRA_BRIGHTNESS, 0.5f); 
				getWindow().setAttributes(layout);
				Log.d(TAG,"Set brightness to "+layout.screenBrightness);
			} catch(Exception e) {
				Log.e(TAG,"Error setting brightness", e);
			}
		} else if (ACTION_FINISH.equals(intent.getAction()) && (intent.getFlags() & Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY)==0) {
			Log.i(TAG,"main activity finish on intent");
			finish();
		}
	}

	@Override
	public void onServiceConnected(ComponentName name, IBinder service) {
		Log.d(TAG,"Service connected");
	}

	@Override
	public void onServiceDisconnected(ComponentName name) {
		Log.d(TAG,"Service disconnected");
	}

}
