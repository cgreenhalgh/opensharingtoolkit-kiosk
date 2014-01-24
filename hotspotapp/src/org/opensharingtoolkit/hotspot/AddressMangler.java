/**
 * 
 */
package org.opensharingtoolkit.hotspot;

import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.SharedPreferences.OnSharedPreferenceChangeListener;
import android.preference.PreferenceManager;
import android.util.Log;

/** Hash mac addresses for anonymisation.
 * 
 * @author pszcmg
 *
 */
public class AddressMangler implements OnSharedPreferenceChangeListener {
	private static final String TAG = "addressmangler";
	private static AddressMangler instance;
	private MessageDigest md;
	private byte salt[];
	
	public static synchronized AddressMangler getInstance(Context context) {
		if (instance==null) 
			instance = new AddressMangler(context);
		return instance; 
	}
	private AddressMangler(Context context) {
		try {
			md = MessageDigest.getInstance("SHA-1");
			SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(context);
			spref.registerOnSharedPreferenceChangeListener(this);
			String hashkey = spref.getString("pref_hashkey", null);
			if (hashkey==null) {
				Log.e(TAG,"COuld not get hashkey from shared preferences");
				hashkey = "9wLNYWbZ";
			}
			else
				Log.d(TAG,"Got hashkey from shared preferences");
			salt = hashkey.getBytes("UTF-8");
		}
		catch (Exception e) {
			Log.e(TAG,"Unable to create message digest", e);
		}
	}
	private Pattern pattern = Pattern.compile("(^|\\s|[:])"+
	"(([0-9a-f][0-9a-f]:[0-9a-f][0-9a-f]:[0-9a-f][0-9a-f]:[0-9a-f][0-9a-f]:[0-9a-f][0-9a-f]:[0-9a-f][0-9a-f])|"+
	"([0-9A-F][0-9A-F]:[0-9A-F][0-9A-F]:[0-9A-F][0-9A-F]:[0-9A-F][0-9A-F]:[0-9A-F][0-9A-F]:[0-9A-F][0-9A-F]))"+
	"($|\\s)");
	/** find and mangle any MAC Addresses */
	public String mangle(String text) {
		Matcher m = pattern.matcher(text);
		if (m.find()) {
			StringBuilder sb = new StringBuilder();
			int ix = 0;
			do {
				int start = m.start(2);
				sb.append(text.substring(ix,start));
				int end = m.end(2);
				String mac = m.group(2);
				sb.append(hashMac(mac));
				ix = end;
			} while (m.find(ix));
			return sb.toString();
		}
		return text;
	}
	private Map<String,String> cache = new HashMap<String,String>();
	private String hashMac(String mac) {
		String hash = cache.get(mac);
		if (hash!=null)
			return hash;
		if (md==null)
			return "*MANGLEERROR*";
		try {
			md.reset();
			md.update(salt);
			md.update(mac.toLowerCase(Locale.US).getBytes("UTF-8"));
			byte digest[] = md.digest();
			StringBuilder sb = new StringBuilder();
			sb.append("*");
			for (byte b : digest) {
				sb.append(getNibble(b));
				sb.append(getNibble(b>>4));
			}
			sb.append("*");
			hash = sb.toString();
			cache.put(mac, hash);
			return hash;
		} catch (UnsupportedEncodingException e) {
			Log.e(TAG,"Error hashing mac", e);
			hash = "*MANGLEERROR*";
			cache.put(mac, hash);
			return hash;
		}
	}
	private char getNibble(int i) {
		i &= 0xf;
		if (i<10)
			return (char)('0'+i);
		else
			return (char)('a'+i-10);
	}
	@Override
	public void onSharedPreferenceChanged(SharedPreferences sharedPreferences,
			String key) {
		if ("pref_hashkey".equals(key)) {
			Log.d(TAG,"hashkey changed in preferences");
			try {
				salt = sharedPreferences.getString("pref_hashkey", "9wLNYWbZ").getBytes("UTF-8");
			} catch (UnsupportedEncodingException e) {
				Log.e(TAG,"Error extracting bytes from hashkey", e);
			}
		}
		else
			Log.d(TAG,"Change to shared preference "+key);
	}
}
