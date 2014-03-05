/**
 * 
 */
package org.opensharingtoolkit.chooser;

import java.io.ByteArrayInputStream;
import java.nio.charset.Charset;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Random;

import org.opensharingtoolkit.httpserver.HttpContinuation;
import org.opensharingtoolkit.httpserver.HttpError;

import android.util.Log;

/** Simple (temporary) redirect service, allowing short URLs for direct entry 
 * and QRCodes, plus possible User Agent-based switching (e.g. no javscript fallback?).
 *
 * @author pszcmg
 *
 */
public class RedirectServer {
	/** temporary redirect entry */
	private static class Redirect {
		String fromPath;
		//TODO String host;
		String toUrl;
		long createdTime;
		long expiresTime;
		@SuppressWarnings("unused")
		int useCount;
	}
	/** temp redirects, key is fromPath */
	private Map<String,Redirect> redirects = new HashMap<String,Redirect>();
	/** temp redirects by time */
	private List<Redirect> redirectsByTime = new LinkedList<Redirect>();
	/** next temp path id */
	private int nextPathId = 0;
	
	static final String TAG = "kiosk-redirect";
	static final int MAX_PATH_ID = 100000;
	
	private static RedirectServer _singleton;
	public static synchronized RedirectServer singleton() {
		if (_singleton==null)
			_singleton = new RedirectServer();
		return _singleton;
	}
	private static Map<String,RedirectServer> mServers = new HashMap<String,RedirectServer>();
	public static synchronized RedirectServer forHost(String host) {
		RedirectServer s = mServers.get(host);
		if (s==null) {
			s = new RedirectServer(host);
			mServers.put(host, s);
		}
		return s;
	}
	public static synchronized RedirectServer forHostOpt(String host) {
		return mServers.get(host);
	}
	
	private RedirectServer() {
		Log.d(TAG,"Created RedirectServer");
		nextPathId = new Random(System.currentTimeMillis()).nextInt(MAX_PATH_ID);
	}
	private RedirectServer(String host) {
		Log.d(TAG,"Created RedirectServer for "+host);
		nextPathId = new Random(System.currentTimeMillis()).nextInt(MAX_PATH_ID);
	}
	
	/** add redirect.
	 * 
	 *  @return unique temporary path for redirect
	 */
	public synchronized String registerTempRedirect(String toUrl, long lifetimeMs) {
		// NB we are synchronized to avoid race to getTempPath and add
		Redirect r = new Redirect();
		r.toUrl = toUrl;
		r.createdTime = System.currentTimeMillis();
		r.expiresTime = r.createdTime + lifetimeMs;
		r.fromPath = getTempPath();
		redirects.put(r.fromPath, r);
		redirectsByTime.add(r);
		Log.d(TAG,"Registered temp redirect "+r.fromPath+" -> "+toUrl);
		return r.fromPath;	
	}

	/** add redirect.
	 * 
	 *  @return unique temporary path for redirect
	 */
	public synchronized boolean registerRedirect(String fromPath, String toUrl, long lifetimeMs) {
		if (toUrl==null) {
			// clear
			Redirect r = redirects.remove(fromPath);
			if (r!=null) {
				redirectsByTime.remove(r);
			}
			return false;
		}
		// NB we are synchronized to avoid race to getTempPath and add
		Redirect r = new Redirect();
		r.toUrl = toUrl;
		r.createdTime = System.currentTimeMillis();
		if (lifetimeMs!=0)
			r.expiresTime = r.createdTime + lifetimeMs;
		r.fromPath = fromPath;
		redirects.put(r.fromPath, r);
		if (lifetimeMs!=0)
			redirectsByTime.add(r);
		Log.d(TAG,"Registered redirect "+r.fromPath+" -> "+toUrl);
		return true;	
	}

	private synchronized String getTempPath() {
		// expire? too many??
		long now = System.currentTimeMillis();
		List<Redirect> rs = new LinkedList<Redirect>();
		int num = 0;
		while(!redirectsByTime.isEmpty()) {
			Redirect r = redirectsByTime.remove(0);
			if (r.expiresTime < now) {
				Log.d(TAG,"Expire redirect "+r.fromPath+" -> "+r.toUrl);
				redirects.remove(r.fromPath);
			} else {
				rs.add(r);
				num++;
				if (num >= MAX_PATH_ID) {
					// discard first/oldest
					Redirect r2 = rs.remove(0);
					redirects.remove(r2.fromPath);
					Log.w(TAG,"Discarding unexpired redirect (too many): "+r.fromPath+" -> "+r.toUrl);
				}
			}
		}
		redirectsByTime = rs;
		
		// unique...
		int attempts = MAX_PATH_ID;
		while((attempts--)>=0) {
			// next id/path
			nextPathId++;
			String fromPath = "/r/"+nextPathId;
			if (!redirects.containsKey(fromPath))
				// OK
				return fromPath;
			Log.w(TAG,"Path clash: "+fromPath+" - try next path...");
		}
		Log.e(TAG,"Could not allocate new temp redirect path");
		throw new RuntimeException("Could not allocate new temp redirect path");
	}

	// handle request as redirect - called from Service
	public void handleRequest(String path, HttpContinuation httpContinuation) throws HttpError {
		// TODO Auto-generated method stub
		Redirect r = null;
		synchronized (this) {
			r = redirects.get(path);
		}
		if (r==null) {
			Log.w(TAG,"Redirect not found: "+path);
			throw new HttpError(404,"File not found");
		}
		r.useCount++;
		Log.d(TAG,"Redirect "+path+" -> "+r.toUrl);
		Map<String,String> extraHeaders = new HashMap<String,String>();
		extraHeaders.put("Location", r.toUrl);
		// do not cache - at least some are changeable redirects!
		extraHeaders.put("Cache-Control", "no-cache, no-store, must-revalidate");
		extraHeaders.put("Pragma", "no-cache");
		extraHeaders.put("Expires", "0");
		String response = "See "+r.toUrl;
		byte body [] = response.getBytes(Charset.forName("UTF-8"));
		httpContinuation.done(307, "Moved temporarily", "text/plan", body.length, new ByteArrayInputStream(body), extraHeaders);
	}
}
