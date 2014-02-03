/**
 * 
 */
package org.opensharingtoolkit.httpserver;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.Hashtable;

import android.util.Log;

/**
 * @author pszcmg
 *
 */
public class HttpUtils {
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
}
