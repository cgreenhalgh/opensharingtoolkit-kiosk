package org.opensharingtoolkit.hotspot;

import org.json.JSONObject;
import org.opensharingtoolkit.common.Record;
import org.opensharingtoolkit.hotspot.LineInputReader.LineListener;

import android.content.Context;
import android.util.Log;
import android.widget.Toast;

/** try to log wifi events (from iwevent command)
 * 
 * @author pszcmg
 *
 */
public class WifiMonitor {
	public static final String TAG = "wifimonitor";
	private Context mContext;
	private BackgroundExecTask mTask;
	
	private class EventListener implements LineListener {
		private String mEvent;
		EventListener(String event) {
			mEvent = event;
		}
		@Override
		public void onLine(String line) {
			JSONObject jo = new JSONObject();
			try {
				jo.put("line", line);
			}
			catch (Exception e) {
				Log.e(TAG,"Error marshalling wifi.event info", e);
			}
			Record.log(mContext, Record.LEVEL_WARN, "wifimonitor", mEvent, jo);
		}
	}
	
	public WifiMonitor(Context context) {
		mContext = context;
		// if i run iwevent as a regular process:
		// - it fails to show join/leave with message "iw_sockets_open: Address family not supported by protocol"
		// - it carries on running after the app is removed. Not sure if this is because .destroy doesn't get called, or process resists
		// if run as root it gets events ok
		TaskKiller.killTask("iwevent", true);
		mTask = new BackgroundExecTask(new EventListener("wifi.event"), new EventListener("wifi.event.error"), "su","-c","iwevent");
		if (!mTask.started()) {
			Toast.makeText(context, "Please install the iwevent command", Toast.LENGTH_LONG).show();
			Log.e(TAG,"Please install iwevent in /system/bin to monitor Wifi join/leave");
		}
	}
	public void close() {
		mTask.cancel();
	}
}
