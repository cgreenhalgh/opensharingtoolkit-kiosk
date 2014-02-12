/**
 * 
 */
package org.opensharingtoolkit.hotspot;

import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.IBinder;
import android.os.Message;
import android.os.Messenger;
import android.preference.PreferenceManager;
import android.util.Log;
import org.opensharingtoolkit.common.Hotspot;

/** We'll make this a bound service to keep it alive (hopefully), and initially 
 * implement it as a messenger in the hope that requests won't need to be hanlded
 * concurrently (can change later if required).
 * 
 * @author pszcmg
 *
 */
public class HotspotService extends Service {

	private static final String TAG = "ost-hotspot";
	private static final int DEFAULT_ARP_INTERVAL_S = 2;
	private static final int MIN_ARP_INTERVAL_S = 2;

    /**
     * Handler of incoming messages from clients.
     */
    class IncomingHandler extends Handler {
        @Override
        public void handleMessage(Message msg) {
            switch (msg.what) {
                case Hotspot.MSG_REDIRECT_PORT:
                	if (handleRedirectPort(msg.arg1, msg.arg2)) {
            			Message reply = Hotspot.getRedirectedPortMessage(msg.arg1, msg.arg2);
            			try {
            				msg.replyTo.send(reply);
            			}
            			catch (Exception e) {
            				Log.w(TAG,"Error sending redirectedPort", e);
            			}
            		}
                    break;
                default:
                    super.handleMessage(msg);
            }
        }
    }

    /**
     * Target we publish for clients to send messages to IncomingHandler.
     */
    final Messenger mMessenger = new Messenger(new IncomingHandler());

    /**
     * When binding to the service, we return an interface to our messenger
     * for sending messages to the service.
     */
    @Override
    public IBinder onBind(Intent intent) {
        return mMessenger.getBinder();
    }
    
    /** attempt port redirect */
	protected boolean handleRedirectPort(int fromPort, int toPort) {
		Log.d(TAG,"redirectPort "+fromPort+" -> "+toPort);
		// TCP only
		return Iptables.redirectPort(fromPort, toPort, false);
	}

	private Handler mDelayHandler = new Handler();
	private ArpMonitor mArpMonitor;
	private ArpPoll mArpPoll = new ArpPoll();
	private WifiMonitor mWifiMonitor;
	private WifiHotspot mWifiHotspot;
	
	@Override
	public void onCreate() {
		super.onCreate();
		Log.d(TAG,"Created HotspotService");
		mArpMonitor = new ArpMonitor(this);
		mWifiMonitor = new WifiMonitor(this);
		mWifiHotspot = new WifiHotspot(this);	
		postPoll();
	}

	private void postPoll() {
		SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(this);
		int arpInterval = DEFAULT_ARP_INTERVAL_S;
		try {
			arpInterval = Integer.valueOf(spref.getString("pref_arppollinterval", Integer.toString(arpInterval)));
		}
		catch (Exception e){
			Log.w(TAG,"Error parsing arppollinterval", e);
		}
		if (arpInterval<MIN_ARP_INTERVAL_S)
			arpInterval = MIN_ARP_INTERVAL_S;
		mDelayHandler.postDelayed(mArpPoll, arpInterval*1000);
	}
	private class ArpPoll implements Runnable {
		@Override
		public void run() {
			SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(HotspotService.this);
			if (spref.getBoolean("pref_arppoll", true)) {
				Log.d(TAG,"ArpPoll...");
				mArpMonitor.poll();
			}
			else 
				Log.d(TAG,"Skip ArpPoll");
			postPoll();
		}		
	}
	
	@Override
	public void onDestroy() {
		super.onDestroy();
		Log.d(TAG,"Destroy HotspotService");
		mDelayHandler.removeCallbacks(mArpPoll);
		mWifiMonitor.close();
		mWifiHotspot.close();
	}

	/*@Override
	public int onStartCommand(Intent intent, int flags, int startId) {
		Log.d(TAG,"Start: "+intent.getAction());
		ExecTask t = new ExecTask() {
			@Override
			protected void onPostExecute(ExecResult result) {
				Log.d(TAG,"Done task (iptables): "+result);
			}			
		};
		t.execute("su","-c","/system/bin/iptables -L -t nat");
	
		  
		return START_STICKY;
	}*/

}
