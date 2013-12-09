/**
 * 
 */
package org.opensharingtoolkit.common;

import android.util.Log;

/** OpenSharingToolkit internal logging API.
 * 
 * @author pszcmg
 *
 */
public class OstLog {
	static String TAG = "OstLog";
	
	public void log(String component, String event, OstLogLevel level, Object info) {
		// TODO really log to logging service
		Log.d("ost:"+component+":"+level, event+": "+info.toString());
	}
}
