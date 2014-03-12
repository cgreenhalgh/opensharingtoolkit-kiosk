/**
 * 
 */
package org.opensharingtoolkit.chooser;

import java.io.ByteArrayInputStream;
import java.io.UnsupportedEncodingException;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.json.JSONObject;
import org.opensharingtoolkit.common.WifiUtils;
import org.opensharingtoolkit.httpserver.HttpContinuation;
import org.opensharingtoolkit.httpserver.HttpError;
import org.opensharingtoolkit.httpserver.HttpUtils;

import android.content.Context;
import android.util.Log;

/** Simple request handler to return download "get" page cf chooserwww/public/get.php.
 * Relies on device compatibility information registered by chooserjs code from mimetypes.json.
 * 
 * @author pszcmg
 *
 */
public class GetServer {
	public static class App {
		String name;
		String url;
		public App() {}
		public App(String name, String url) {
			this.name = name;
			this.url = url;
		}
	}
	public static class MimetypeCompat {
		String mimetype;
		String devicetype;
		Pattern userAgentPattern;
		Boolean builtin;
		List<App> apps;
		public MimetypeCompat() {}
		/**
		 * @param mimetype
		 * @param devicetype
		 * @param builtin
		 * @param apps
		 */
		public MimetypeCompat(String mimetype, String devicetype, String userAgentPattern,
				Boolean builtin, List<App> apps) {
			super();
			this.mimetype = mimetype;
			this.devicetype = devicetype;
			try {
				if (userAgentPattern!=null)
					this.userAgentPattern= Pattern.compile(userAgentPattern);
			} catch (Exception e) {
				Log.e(TAG,"Error parsing userAgentPattern "+userAgentPattern+": "+e);
			}
			this.builtin = builtin;
			this.apps = apps;
		}
		
	}
	private static final String TAG = "GetServer";
	public static Map<String,Map<String,MimetypeCompat>> mCompat = new HashMap<String,Map<String,MimetypeCompat>>();
	public static synchronized void registerMimetypeCompat(String mimetype, String devicetype, String userAgentPattern,
				Boolean builtin, List<App> apps) {
		MimetypeCompat compat = new MimetypeCompat(mimetype, devicetype, userAgentPattern, builtin, apps);
		Map<String,MimetypeCompat> compats = mCompat.get(mimetype);
		if (compats==null) {
			compats = new HashMap<String,MimetypeCompat>();
			mCompat.put(mimetype, compats);
		}
		compats.put(devicetype, compat);
		Log.d(TAG,"Registered mimetypeCompat for "+mimetype+" with "+devicetype);
	}
	
	private static GetServer mSingleton;
	public static synchronized GetServer singleton() {
		if (mSingleton==null)
			mSingleton = new GetServer();
		return mSingleton;
	}

	// handle request - called from Service
	public void handleRequest(Context context, String path, Map<String, String> headers, HttpContinuation httpContinuation) throws HttpError {
		Hashtable<String,String> params = HttpUtils.getParams(path);
		if (params==null) {
			Log.w(TAG,"request get without parameters: "+path);
			throw HttpError.badRequest("GetServer expected URL-encoded parameters");
		}
		String userAgent = headers.get("user-agent");
		Log.d(TAG,"Get request for user agent "+userAgent);
		StringBuilder resp = new StringBuilder();
		resp.append("<!DOCTYPE html PUBLIC \"-//W3C//DTD HTML 4.01 Transitional//EN\" \"http://www.w3.org/TR/html4/loose.dtd\">\n"+
            "<html>"+
            "<head>"+
            "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">"+
            "<meta name=\"viewport\" content=\"width=device-width, user-scalable=false;\">"+
            "<title>Kiosk phone helper</title>"+
            "</head>"+
            "<body>"+
            "<p>Great! You're on the ");
		String ssid = params.get("n");
		if (ssid!=null && ssid.length()>0)
			resp.append("right nextwork ("+ssid+")");
		else {
			int wifiState = WifiUtils.getWifiState(context);
			if (wifiState==WifiUtils.WIFI_AP_STATE_ENABLED || wifiState==WifiUtils.WIFI_AP_STATE_ENABLING) {
				ssid = "*kiosk*";
				resp.append("kiosk network (this is not the Internet)");
			}
			else
				resp.append("local network");
		}
		resp.append("</p>"+
				"<h1 style=\"\">Get ");
		String title = params.get("t");
		if (title!=null)
			resp.append(title);
		resp.append("</h1>");
		String mime = params.get("m");
		String devicetype = null;
		MimetypeCompat compat = null;
		synchronized (GetServer.class) {
			if (mime==null) {
				resp.append("<p>Warning: this content may not be supported on your device! (I can\'t tell because its MIME type is unspecified)</p>");  
			} else {
				Map<String,MimetypeCompat> compats = mCompat.get(mime);
				if (compats==null) {
					resp.append("<p>Warning: this content may not be supported on your device! (I can\'t tell because I am cannot get information about its MIME type)</p>");  
				} else {
					for (Map.Entry<String,MimetypeCompat> c : compats.entrySet()) {
						if (compat==null && "other".equals(c.getKey())) {
							devicetype = c.getKey();
							compat = c.getValue();
						}
						if (c.getValue().userAgentPattern!=null && userAgent!=null && c.getValue().userAgentPattern.matcher(userAgent).find()) {
							//Log.d(TAG,"User agent match for "+userAgent+" with "+c.getKey());
							devicetype = c.getKey();
							compat = c.getValue();
						} else if (c.getValue().userAgentPattern!=null && userAgent!=null) {
							//Log.d(TAG,"User agent match failed for "+userAgent+" with "+c.getKey()+" using "+c.getValue().userAgentPattern);							
						} else if (userAgent!=null) {
							//Log.d(TAG,"No userAgentPattern for "+mime+" for "+c.getKey());
						}
					}
					if (compat==null) {
						resp.append("<p>Warning: this content may not be supported on your device! (I cannot find any compatibility information for MIME type "+mime+")</p>");
					} else {
						if (compat.apps.size()>0) {
							for (App app : compat.apps) {
								resp.append("<p>Note: you may need <a href=\""+app.url+"\">"+app.name+"</a> or a similar helper application to view this download. (I think your device type is "+devicetype+")</p>");
							}
							if (ssid!=null)
								resp.append("<p>You may need to switch back to standard Internet to download the helper application.</p>");
						}
						else if (compat.builtin!=Boolean.TRUE) {
							resp.append("<p>Warning: this content may not be supported on your device! (I think your device type is "+devicetype+")</p>");
						} 
						else
							resp.append("<p>This content should have built-in support on your device. (I think your device type is "+devicetype+")</p>");
					}
				}
			}
		}
		if (devicetype!=null && devicetype.equals("ios") && userAgent!=null) {
			if (userAgent.indexOf("safari")<0 && userAgent.indexOf("Safari")<0) 	
				resp.append("<p>Note: you may get better results if you open this page in the safari browser before downloading.</p>");
		}
		resp.append("<p>");
		String url = params.get("u");
		if (url!=null) {
			resp.append("<a style=\"font-size:24pt;\" href=\""+url+"\" style=\"\">Download</a>");
		} else {
			resp.append("Sorry, something went wrong opening this page - I don\'t know what content you were trying to get; please go back and try again.");	
		}
		resp.append("</p>"+
				"</body>"+
				"</html>");
		
	    Log.d(TAG,"get done");
	    byte data[];
		try {
			data = resp.toString().getBytes("UTF-8");
		} catch (UnsupportedEncodingException e) {
			throw new HttpError(500, "Error converting get response to bytes");
		}
	    httpContinuation.done(200, "OK", "text/html", data.length, new ByteArrayInputStream(data), null);
	}
	// handle request - called from Service
	public void handleRequestForRecent(Context context, String path, Map<String, String> headers, HttpContinuation httpContinuation) throws HttpError {
		String title = null;
		String url = null;
		try {
			JSONObject sendCacheItem = (JSONObject)SharedMemory.getInstance().get("sendCacheItem");
			title = sendCacheItem.getString("title");
			url = sendCacheItem.getString("url");
		} catch (Exception e) {
			Log.w(TAG,"Error reading sendCacheItem: "+e, e);
			//throw new HttpError(500, "Error getting latest item");
		}
		StringBuilder resp = new StringBuilder();
		resp.append("<!DOCTYPE html PUBLIC \"-//W3C//DTD HTML 4.01 Transitional//EN\" \"http://www.w3.org/TR/html4/loose.dtd\">\n"+
            "<html>"+
            "<head>"+
            "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">"+
            "<meta name=\"viewport\" content=\"width=device-width, user-scalable=false;\">"+
            "<title>Kiosk Recently Requested Items</title>"+
            "</head>"+
            "<body>"+
            "<p>Great! You're on the ");
		String ssid = null;
		int wifiState = WifiUtils.getWifiState(context);
		if (wifiState==WifiUtils.WIFI_AP_STATE_ENABLED || wifiState==WifiUtils.WIFI_AP_STATE_ENABLING) {
			ssid = "*kiosk*";
			resp.append("kiosk network (this is not the Internet)");
		}
		else {
			resp.append("local network");
		}
		resp.append("</p><h1 style=\"\">Requested Items</h1>");
		if (title!=null && url!=null) {
			resp.append("<a href=\""+url+"\"><h2>"+title+"</h2></a>\n");
		}
		else {
			resp.append("<p>There is no recent item; please select an item on the kiosk and choose 'Send Locally'.</p>");
		}
		resp.append("<p><a href=\"#\" onclick=\"javascript:location.reload()\">Reload this page to check for newly selected items</p></a>");
		resp.append("</body>"+
				"</html>");
		
	    Log.d(TAG,"get recent done");
	    byte data[];
		try {
			data = resp.toString().getBytes("UTF-8");
		} catch (UnsupportedEncodingException e) {
			throw new HttpError(500, "Error converting get recent response to bytes");
		}
	    httpContinuation.done(200, "OK", "text/html", data.length, new ByteArrayInputStream(data), null);
	}
}
