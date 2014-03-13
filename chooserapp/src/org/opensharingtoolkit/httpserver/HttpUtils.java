/**
 * 
 */
package org.opensharingtoolkit.httpserver;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

import android.util.Log;

/**
 * @author pszcmg
 *
 */
public class HttpUtils {
	private static final String TAG = "http-utils";
	public static Hashtable<String,String> getParams(String path) throws HttpError {
		int ix = path.indexOf("?");
		if (ix<0) {
			return null;
		}
		String paramStrings[] = path.substring(ix+1).split("&");
		Hashtable<String,String> params = new Hashtable<String,String>();
		for (String p : paramStrings) {
			int eix = p.indexOf("=");
			if (eix<0)
				params.put(p, p);
			else if (eix==0) {
				//Log.w(TAG,"parameter name missing: "+path);
				throw HttpError.badRequest("parameter name missing ("+p+")");
			} else
				try {
					params.put(p.substring(0,eix), URLDecoder.decode(p.substring(eix+1), "UTF-8"));
				} catch (UnsupportedEncodingException e) {
			    	throw new HttpError(500,"Problem decoding parameters: "+e.getMessage());
				}
		}
		return params;
	}
    public static String dateToString(long date) {
        SimpleDateFormat dateFormat = new SimpleDateFormat(
            "EEE, dd MMM yyyy HH:mm:ss z", Locale.US);
        dateFormat.setTimeZone(TimeZone.getTimeZone("GMT"));
        return dateFormat.format(new Date(date));
    }
	public static void setHeaderExpires(Map<String, String> headers, long time) {
		headers.put("Expires", dateToString(time));
	}
	public static void setHeaderLastModified(Map<String, String> headers, long time) {
		headers.put("Last-Modified", dateToString(time));
	}
	public static Map<String, String> getHeadersExpires(int longTimeMs) {
		Map<String,String> headers = new HashMap<String,String>();
		long expires = System.currentTimeMillis()+longTimeMs;
		setHeaderExpires(headers, expires);
		return headers;
	}
	public static void handleNotModifiedSince(Map<String, String> requestHeaders, long lastModified) throws HttpError {
		String ifModifiedSinceS = requestHeaders.get("if-modified-since");
		if (ifModifiedSinceS==null)
			return;
		if (lastModified==0)
			return;
		Date ifModifiedSince = null;
		try {
	        SimpleDateFormat dateFormat = new SimpleDateFormat(
	                "EEE, dd MMM yyyy HH:mm:ss z", Locale.US);
	        ifModifiedSince = dateFormat.parse(ifModifiedSinceS);
		}
		catch (Exception e) {
			Log.w(TAG,"Unable to parse HTTP if-modified-since date "+ifModifiedSince+": "+e);
			return;
		}
		if (lastModified>ifModifiedSince.getTime()) 
			return;
		Log.i(TAG,"Not modified since "+ifModifiedSince+" (modified "+dateToString(lastModified)+") - return 304");
		throw new HttpError(304, "Not Modified");
	}
}
