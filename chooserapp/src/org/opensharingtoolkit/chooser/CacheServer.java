/**
 * 
 */
package org.opensharingtoolkit.chooser;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;
import org.opensharingtoolkit.httpserver.HttpContinuation;
import org.opensharingtoolkit.httpserver.HttpError;

import android.content.Context;
import android.util.Log;

/** Serve files out of cache
 * @author pszcmg
 *
 */
public class CacheServer {
	
	private static final String TAG = "cache-server";
	private CacheServer() {		
	}
	private static CacheServer _singleton;
	public static synchronized CacheServer singleton() {
		if (_singleton==null)
			_singleton = new CacheServer();
		return _singleton;
	}
    private long mCacheLastModified = 0;
    private static class Entry {
    	String url;
    	String path;
    	File file;
    	String length;
    	String lastmod;
    }
    private Map<String,Entry> mEntries = new HashMap<String,Entry>();
    private String mBaseurl;
    
    /** attempt to return result from file cache.
     * 
     * @param context
     * @param host
     * @param path
     * @param httpContinuation
     * @return true if handled
     * 
     * @throws IOException
     * @throws HttpError
     */
	public File checkCache(Context context, String host, String path) {
		updateCache(context);
		Entry e = null;
		String url = "http://"+host+path;
		synchronized (this) {
			e = mEntries.get(url);
		}
		if (e==null || e.file==null)
			return null;
		Log.d(TAG,"Found request in cache: "+url);
		return e.file;
	}

	private void updateCache(Context context) {
		File dir = context.getExternalFilesDir(null);
		if (dir==null) {
			Log.w(TAG, "getLocalFilePrefix with external storage not available");
			return;
		}
		File cache = new File(dir, "cache.json");
		if (cache.canRead() && cache.lastModified() > mCacheLastModified) {
	
			long lastmod = cache.lastModified();
			Log.d(TAG,"Update cache...");
			try {
				BufferedReader bfr = new BufferedReader(new InputStreamReader(new FileInputStream(cache), "UTF-8"));
				String line = bfr.readLine();
				bfr.close();
				JSONObject obj = new JSONObject(line);
				if (obj.has("baseurl")) {
					mBaseurl = obj.getString("baseurl");
					if (!mBaseurl.endsWith("/"))
						mBaseurl = mBaseurl+"/";
					Log.d(TAG,"Cache baseurl="+mBaseurl);
				}
				else 
					mBaseurl = null;
				JSONArray files = obj.getJSONArray("files");
				Map<String,Entry> entries = new HashMap<String,Entry>();
				for (int i=0; i<files.length(); i++)
				{
					JSONObject file = files.getJSONObject(i);
					Entry e = new Entry();
					if (file.has("lastmod"))
						e.lastmod = file.getString("lastmod");
					if (file.has("length"))
						e.length = file.getString("length");
					if (file.has("path")) {
						e.path = file.getString("path");
						e.file = new File(dir, e.path);
					}
					if (file.has("url")) {
						e.url = file.getString("url");
						entries.put(e.url, e);
					}
				}
				synchronized (this) {
					mCacheLastModified = lastmod;
					mEntries = entries;
					Log.i(TAG,"Updated cache");
				}
			}
			catch (Exception e) {
				Log.w(TAG,"Error reading cache: "+e, e);
				return;
			}
		}
	}
	public synchronized String getBaseurl() {
		return mBaseurl;
	}
}
