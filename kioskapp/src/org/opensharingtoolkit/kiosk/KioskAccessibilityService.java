/**
 * 
 */
package org.opensharingtoolkit.kiosk;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.OnSharedPreferenceChangeListener;
import android.preference.PreferenceManager;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;

/**
 * @author pszcmg
 *
 */
public class KioskAccessibilityService extends AccessibilityService implements OnSharedPreferenceChangeListener {

	private static final String TAG = "kiosk-accessibility";
	private SoftKeys mSoftKeys = null;
	/* (non-Javadoc)
	 * @see android.app.Service#onCreate()
	 */
	@Override
	public void onCreate() {
		// TODO Auto-generated method stub
		super.onCreate();
		// If using touch explore...
		// getServiceInfo().flags = AccessibilityServiceInfo.FLAG_REQUEST_TOUCH_EXPLORATION_MODE;
		Log.d(TAG,"onCreate");
	}

	/* (non-Javadoc)
	 * @see android.accessibilityservice.AccessibilityService#onServiceConnected()
	 */
	@Override
	protected void onServiceConnected() {
		// TODO Auto-generated method stub
		super.onServiceConnected();
		Log.d(TAG,"onServiceConnected");
		init();
	}

	/* (non-Javadoc)
	 * @see android.accessibilityservice.AccessibilityService#onGesture(int)
	 */
	@Override
	protected boolean onGesture(int gestureId) {
		// TODO Auto-generated method stub
		Log.d(TAG,"onGesture "+gestureId);
		return super.onGesture(gestureId);
	}

	/** initialise - from onConnected or onRebind */
	private void init() {
		if (mSoftKeys==null)
			mSoftKeys = new SoftKeys();
		SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(this);
		spref.registerOnSharedPreferenceChangeListener(this);
		checkSoftkeys(spref);
	}

	/* (non-Javadoc)
	 * @see android.app.Service#onUnbind(android.content.Intent)
	 */
	@Override
	public boolean onUnbind(Intent intent) {
		// TODO Auto-generated method stub
		SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(this);
		spref.unregisterOnSharedPreferenceChangeListener(this);
		if (mSoftKeys!=null)
			mSoftKeys.disable();
		// request rebind (in case??)
		return true;
	}
	

	/* (non-Javadoc)
	 * @see android.app.Service#onRebind(android.content.Intent)
	 */
	@Override
	public void onRebind(Intent intent) {
		// TODO Auto-generated method stub
		Log.d(TAG,"onRebind");
		init();
	}

	private String lastPackage;
	/* (non-Javadoc)
	 * @see android.accessibilityservice.AccessibilityService#onAccessibilityEvent(android.view.accessibility.AccessibilityEvent)
	 */
	@Override
	public void onAccessibilityEvent(AccessibilityEvent event) {
		// TODO Auto-generated method stub
		SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(this);
		boolean kioskmode = spref.getBoolean("pref_kioskmode", false);
		Log.d(TAG,"onAccessibilityEvent "+event.getEventType()+" kioskmode="+kioskmode);
		if (event.getEventType()==AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
			String pkg = getString(R.string.run_package);
			String newPkg = event.getPackageName().toString();
			if (kioskmode) {
				/** can't always go back from apps, but can't oprn with intent wehn already underneath, e.g. notifications or power menu */
				if (!pkg.equals(newPkg) && pkg.equals(lastPackage) && ("android".equals(newPkg) || "com.android.systemui".equals(newPkg))) {
					Log.d(TAG,"Window "+newPkg+": trying back");
					this.performGlobalAction(GLOBAL_ACTION_BACK);
				}
				else {
					Log.d(TAG,"Window "+newPkg);
					if (!pkg.equals(newPkg) && !getPackageName().equals(newPkg)) {
						Log.d(TAG,"Window "+newPkg+": trying start");
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
			}
			lastPackage = newPkg;
		}
	}

	/* (non-Javadoc)
	 * @see android.accessibilityservice.AccessibilityService#onInterrupt()
	 */
	@Override
	public void onInterrupt() {
		// TODO Auto-generated method stub
		Log.d(TAG,"onInterrupt");
	}

	@Override
	public void onSharedPreferenceChanged(SharedPreferences sharedPreferences,
			String key) {
		// TODO Auto-generated method stub
		if ("pref_softback".equals(key) || "pref_softhome".equals(key)) {
			checkSoftkeys(sharedPreferences);
		}
	}

	private void checkSoftkeys(SharedPreferences sharedPreferences) {
		// TODO Auto-generated method stub
		boolean softhome = sharedPreferences.getBoolean("pref_softhome", false);
		boolean softback = sharedPreferences.getBoolean("pref_softback", false);
		Log.d(TAG,"pref_softhome = "+softhome+", pref_softback = "+softback);
		if (mSoftKeys==null)
			Log.e(TAG,"mSoftKeys = null (pref_softhome/back changed to "+softhome+"/"+softback+")");
		else {
			mSoftKeys.disable();
			if (softhome || softback)
				mSoftKeys.enable(this, softhome, softback);
		}

	}

}
