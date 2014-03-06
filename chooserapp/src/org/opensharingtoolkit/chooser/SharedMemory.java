/**
 * 
 */
package org.opensharingtoolkit.chooser;

import java.util.HashMap;
import java.util.Map;

import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;
import org.json.JSONTokener;

import android.util.Log;

/** Simple key-value store for browser javascript to share state with server page(s).
 * 
 * @author pszcmg
 *
 */
public class SharedMemory {
	public static enum Encoding {
		STRING, JSON
	}
	public static class Entry {
		String key;
		Encoding encoding;
		String value;
		/**
		 * @param key
		 * @param encoding
		 * @param value
		 */
		public Entry(String key, Encoding encoding, String value) {
			this.key = key;
			this.encoding = encoding;
			this.value = value;
		}
		
		/* (non-Javadoc)
		 * @see java.lang.Object#toString()
		 */
		@Override
		public String toString() {
			return "Entry [key=" + key + ", encoding=" + encoding + ", value="
					+ value + "]";
		}

		/**
		 * 
		 */
		public Entry() {}
	}
	private static final String TAG = "sharedmemory";
	private static SharedMemory mInstance;
	public static synchronized SharedMemory getInstance() {
		if (mInstance==null)
			mInstance = new SharedMemory();
		return mInstance;
	}
	private Map<String,Entry> entries = new HashMap<String,Entry>();
	public synchronized Entry getEntry(String key) {
		Entry e = entries.get(key);
		Log.d(TAG,"getEntry "+key+" -> "+(e==null ? "null" : e.toString()));
		return e;
	}
	public synchronized void put(String key, Encoding encoding, String value) {
		Entry e = new Entry(key, encoding, value);
		Log.d(TAG,"put "+e.toString());
		entries.put(key, e);
	}
	public void put(String key, Object value) throws JSONException {
		if (value==null) 
			entries.remove(key);
		else if (value instanceof String) 
			put(key, Encoding.STRING, (String)value);
		else {	
			JSONStringer js = new JSONStringer();
			js.value(value);
			put(key, Encoding.JSON, js.toString());
		}
	}
	public String getString(String key) throws JSONException {
		Object value = get(key);
		if (value==null)
			return null;
		if (value instanceof String)
			return (String)value;
		throw new JSONException("Encoded value "+key+" not a string: "+value);
	}
	public Object get(String key) throws JSONException {
		Entry e = getEntry(key);
		if (e==null)
			return null;
		if (e.encoding==Encoding.STRING)
			return e.value;
		if (e.encoding==Encoding.JSON){
			JSONTokener jt = new JSONTokener(e.value);
			return jt.nextValue();
		}
		return null;
	}
}
