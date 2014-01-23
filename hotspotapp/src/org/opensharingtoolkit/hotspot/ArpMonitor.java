/**
 * 
 */
package org.opensharingtoolkit.hotspot;

import java.util.HashMap;
import java.util.Map;

import org.json.JSONObject;
import org.opensharingtoolkit.common.Record;

import android.content.Context;
import android.util.Log;

/**
 * @author pszcmg
 *
 */
public class ArpMonitor {

	private static final String TAG = "arpmonitor";
	private Map<String,String> entries = new HashMap<String,String>();
	private Context mContext;
	public ArpMonitor(Context context) {
		this.mContext = context;
	}
	public void poll() {
		ExecResult res = ExecTask.exec("ip","neigh");
		Map<String,String> oldEntries = entries;
		entries = new HashMap<String,String>();
		if (res.isSuccess()) {
			String lines[] = res.getStdout().split("\n");
			for (String line : lines) {
				if (line.length()==0)
					continue;
				int ix = line.indexOf(" ");
				String ip = ix>=0 ? line.substring(0,ix) : line;
				entries.put(ip,  line);
			}
		}
		else
			Log.w(TAG,"Error doing ip neigh");
		for (Map.Entry<String, String> entry : entries.entrySet()) {
			String oldLine = oldEntries.remove(entry.getKey());
			JSONObject jo = new JSONObject();
			try {
				jo.put("ip", entry.getKey());
				jo.put("entry", entry.getValue());
			}
			catch (Exception e) {
				Log.e(TAG,"Error marshalling arp info", e);
			}
			if (oldLine==null) {
				Record.log(mContext, Record.LEVEL_INFO, "arpmonitor", "arp.add", jo);
			} else if (!oldLine.equals(entry.getValue())) {
				Record.log(mContext, Record.LEVEL_INFO, "arpmonitor", "arp.update", jo);				
			}
		}
		for (Map.Entry<String, String> entry : oldEntries.entrySet()) {
			JSONObject jo = new JSONObject();
			try {
				jo.put("ip", entry.getKey());
				jo.put("entry", entry.getValue());
			}
			catch (Exception e) {
				Log.e(TAG,"Error marshalling arp info", e);
			}
			Record.log(mContext, Record.LEVEL_INFO, "arpmonitor", "arp.delete", jo);
		}
	}
}
