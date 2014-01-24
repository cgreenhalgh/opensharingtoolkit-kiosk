/**
 * 
 */
package org.opensharingtoolkit.hotspot;

import android.app.Service;
import android.content.Intent;
import android.os.Handler;
import android.os.IBinder;
import android.os.Message;
import android.os.Messenger;
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
	private static final long ARP_INTERVAL = 2000;

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
		return Iptables.redirectPort(fromPort, toPort);
	}

	private Handler mDelayHandler = new Handler();
	private ArpMonitor mArpMonitor;
	private ArpPoll mArpPoll = new ArpPoll();
	private WifiMonitor mWifiMonitor;
	
	@Override
	public void onCreate() {
		super.onCreate();
		Log.d(TAG,"Created HotspotService");
		mArpMonitor = new ArpMonitor(this);
		mDelayHandler.postDelayed(mArpPoll, ARP_INTERVAL);
		mWifiMonitor = new WifiMonitor(this);
	}

	private class ArpPoll implements Runnable {
		@Override
		public void run() {
			Log.d(TAG,"ArpPoll...");
			mArpMonitor.poll();
			mDelayHandler.postDelayed(this, ARP_INTERVAL);
		}		
	}
	
	@Override
	public void onDestroy() {
		super.onDestroy();
		Log.d(TAG,"Destroy HotspotService");
		mDelayHandler.removeCallbacks(mArpPoll);
		mWifiMonitor.close();
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
