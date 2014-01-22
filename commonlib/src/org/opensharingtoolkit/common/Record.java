/**
 * 
 */
package org.opensharingtoolkit.common;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;

import android.content.Context;
import android.content.Intent;
import android.util.Log;

/** Add to permanent/study record (if logging app installed)
 * @author pszcmg
 *
 */
public class Record {
	public static final int LEVEL_TRACE = 0;
	public static final int LEVEL_DEBUG = 2;
	public static final int LEVEL_INFO = 4;
	public static final int LEVEL_WARN = 6;
	public static final int LEVEL_ERROR = 8;
	public static final int LEVEL_SEVERE = 10;
	private static final String TAG = "record";

	public static void t(Context context, String component, String event, Object info) {
		log(context, LEVEL_TRACE, component, event, info);
	}
	public static void d(Context context, String component, String event, Object info) {
		log(context, LEVEL_DEBUG, component, event, info);
	}
	public static void i(Context context, String component, String event, Object info) {
		log(context, LEVEL_INFO, component, event, info);
	}
	public static void w(Context context, String component, String event, Object info) {
		log(context, LEVEL_WARN, component, event, info);
	}
	public static void e(Context context, String component, String event, Object info) {
		log(context, LEVEL_ERROR, component, event, info);
	}
	public static void s(Context context, String component, String event, Object info) {
		log(context, LEVEL_SEVERE, component, event, info);
	}

	public static void log(Context context, int level, String component, String event, Object oinfo) {
		long now = System.currentTimeMillis();
		String info = packInfo(oinfo);
		Intent i = new Intent(); //"org.opensharingtoolkit.intent.action.LOG");
		i.setClassName("org.opensharingtoolkit.logging","org.opensharingtoolkit.logging.LoggingService");
		i.putExtra("time", now);
		i.putExtra("level", level);
		i.putExtra("component", component);
		i.putExtra("event", event);
		if (info!=null)
			i.putExtra("info", info);
		try {
			context.startService(i);
		}
		catch (ThreadDeath td) {
			// rethrow!!
			throw td;
		}
		catch (RuntimeException e) {
			Log.e(TAG,"Could not log: "+level+" "+component+" "+event+": "+e);
		}
		catch (Exception e) {
			Log.e(TAG,"Could not log: "+level+" "+component+" "+event+": "+e);
		}
	}
	private static String packInfo(Object oinfo) {
		if (oinfo==null)
			return "null";
		if (oinfo instanceof String || oinfo instanceof Integer || oinfo instanceof Long || oinfo instanceof Boolean || oinfo instanceof Double) {
			JSONStringer s = new JSONStringer();
			try {
				s.value(oinfo);
				return s.toString();
			} catch (JSONException e) {
				Log.w(TAG,"Error stringing "+oinfo+": "+e);
				return null;
			}
		}
		if (oinfo instanceof JSONObject) 
			return ((JSONObject)oinfo).toString();
		if (oinfo instanceof JSONArray) 
			return ((JSONArray)oinfo).toString();
		Log.w(TAG,"Unhandled info type "+oinfo.getClass().getName());
		return null;
	}
}
