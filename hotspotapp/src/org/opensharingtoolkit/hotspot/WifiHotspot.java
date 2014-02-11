/**
 * 
 */
package org.opensharingtoolkit.hotspot;

import org.opensharingtoolkit.common.WifiUtils;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.SharedPreferences.OnSharedPreferenceChangeListener;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.WifiManager;
import android.preference.PreferenceManager;
import android.util.Log;
import android.widget.Toast;

/** Control Wifi AP functions.
 * Roughly, when we are started or (force) hotspot is changed we try to enable/disable WIFI_AP state.
 * If/when captive portal is (made) true and WIFI_AP is enabled we try to kill/restart dnsmasq.
 * When captive portal is made untrue we try to disable/re-enable WIFI_AP state.
 * 
 * @author pszcmg
 *
 */
public class WifiHotspot implements OnSharedPreferenceChangeListener {

	private static final String TAG = "wifi-hotspot";
	private static final String WIFI_AP_STATE_CHANGED_ACTION = "android.net.wifi.WIFI_AP_STATE_CHANGED";
	private static final String PREF_HOTSPOT = "pref_hotspot";
	private static final String PREF_CAPTIVEPORTAL = "pref_captiveportal";
	private static final String PREF_HOSTNAME = "pref_hostname";
	private static final String PREF_SSID = "pref_ssid";
	private static final String DNSMASQ = "/system/bin/dnsmasq";
	private Context mContext;
	private boolean mOurDnsmasq = false;
	private BackgroundExecTask mDnsmasq;
	
	private BroadcastReceiver mWifiReceiver = new BroadcastReceiver() {
		@Override
		public void onReceive(Context context, Intent intent) {
			// TODO Auto-generated method stub
			int state = intent.getIntExtra(WifiManager.EXTRA_WIFI_STATE, -1);
			Log.d(TAG,"Receive "+intent.getAction()+": state="+state);
			if (state==WifiUtils.WIFI_AP_STATE_ENABLED)
				// restarted system version, hopefully
				mOurDnsmasq = false;
			checkState();
		}
	};
	public WifiHotspot(Context context) {		
		this.mContext = context;
		SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(context);
		spref.registerOnSharedPreferenceChangeListener(this);
		IntentFilter intentFilter = new IntentFilter();
		//intentFilter.addAction(WifiManager.NETWORK_STATE_CHANGED_ACTION);
		intentFilter.addAction(WifiManager.WIFI_STATE_CHANGED_ACTION);
		intentFilter.addAction(WIFI_AP_STATE_CHANGED_ACTION);
		context.registerReceiver(mWifiReceiver, intentFilter);
		checkPreferences();
	}

	private void checkPreferences() {
		checkState();
	}

	private void checkState() {
		int state = WifiUtils.getWifiState(mContext);
		WifiConfiguration apConfig = WifiUtils.getWifiApConfiguration(mContext);
		//Log.d(TAG,"WifiAp config, SSID = "+(apConfig==null ? "(config null)": apConfig.SSID));
		SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(mContext);
		boolean hotspot = spref.getBoolean(PREF_HOTSPOT, false);
		boolean captiveportal = spref.getBoolean(PREF_CAPTIVEPORTAL, false);
		String ssid = spref.getString(PREF_SSID, "Leaflets0");
		// TODO Auto-generated method stub

		
		if (state==WifiManager.WIFI_STATE_DISABLED) {
			// chance to tidy up?!
			if (TaskKiller.findTask(DNSMASQ)) {
				Log.w(TAG,"Found dnsmasq with WiFi disabled; try to kill it");
				TaskKiller.killTask(DNSMASQ, true);
			}
			
			if (hotspot) {
				Log.d(TAG,"Try to enable AP");
				WifiUtils.setWifiApEnabled(mContext, ssid, true);
			}
			else {
				Log.d(TAG,"Try to enable Wifi");
				WifiUtils.setWifiEnabled(mContext, true);			
			}
		}
		else if (state==WifiManager.WIFI_STATE_ENABLED) {
			if (hotspot) {
				Log.d(TAG,"Try to disable Wifi ready for AP");
				WifiUtils.setWifiEnabled(mContext, false);
			}
			else
				Log.d(TAG,"Wifi correctly enabled (not hotspot)");
		}
		else if (state==WifiUtils.WIFI_AP_STATE_ENABLED) {
			if (!hotspot) {
				Log.d(TAG,"Try to disable AP ready for Wifi");
				WifiUtils.setWifiApEnabled(mContext, ssid, false);				
			}
			else if (captiveportal && !mOurDnsmasq) {
				mOurDnsmasq = true;
				Log.d(TAG,"Try to restart dnsmasq");
				restartDnsmasq();
			}
			else if (!captiveportal && mOurDnsmasq) {
				Log.d(TAG,"Try to restart AP to reset dnsmasq");
				WifiUtils.setWifiApEnabled(mContext, ssid, false);
			}
			else if (apConfig!=null && !ssid.equals(apConfig.SSID)) {
				Log.d(TAG,"Try to restart AP to change SSID from "+apConfig.SSID+" to "+ssid);
				WifiUtils.setWifiApEnabled(mContext, ssid, false);
			}
			else
				Log.d(TAG,"AP correctly enabled (captiveportal="+mOurDnsmasq+")");
		}
		else if (state==WifiUtils.WIFI_AP_STATE_DISABLLING) {
			if (mOurDnsmasq) {
				Log.d(TAG,"Try to kill our dnsmasq");
				synchronized (this) {
					if (mDnsmasq!=null) {
						mDnsmasq.cancel();
						mDnsmasq = null;
					}
				}
				if (TaskKiller.findTask(DNSMASQ)) {
					Log.d(TAG,"Found our dnsmasq still alive; try to kill it");
					TaskKiller.killTask(DNSMASQ, true);
				}
			}
			else
				Log.d(TAG,"Wifi state "+state+" - ignored/waiting");
		}
		else
			Log.d(TAG,"Wifi state "+state+" - ignored/waiting");
	}

	private void restartDnsmasq() {
		synchronized (this) {
			if (mDnsmasq!=null) {
				mDnsmasq.cancel();
				mDnsmasq = null;
			}
		}
		if (TaskKiller.findTask(DNSMASQ)) {
			Log.d(TAG,"Found dnsmasq; try to kill it");
			TaskKiller.killTask(DNSMASQ, true);
		}
		// start our own...
		synchronized (this) {
			// TODO need local IP address for --address and DHCP range
			mDnsmasq = new BackgroundExecTask(null, null, "su", "-c", "/system/bin/dnsmasq", "--keep-in-foreground", "--no-poll","--dhcp-option-force=43,ANDROID_METERED", "--pid-file", "" /*, "--dhcp-range=%s,%s,%d", "--address=/#/LOCALIP"*/);
			if (!mDnsmasq.started()) {
				Toast.makeText(mContext, "Could not run dnsmasq", Toast.LENGTH_LONG).show();
				Log.e(TAG,"Could not run dnsmasq");
			}
		}
	}

	@Override
	public void onSharedPreferenceChanged(SharedPreferences sharedPreferences,
			String key) {
		Log.d(TAG,"Changed preference "+key);
		checkPreferences();
	}
	
	public void close() {
		SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(mContext);
		spref.unregisterOnSharedPreferenceChangeListener(this);
		mContext.unregisterReceiver(mWifiReceiver);
		synchronized (this) {
			if (mDnsmasq!=null) {
				mDnsmasq.cancel();
				mDnsmasq = null;
			}
		}
	}
}
