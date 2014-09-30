/**
 * 
 */
package org.opensharingtoolkit.chooser;

import java.io.File;
import java.lang.reflect.Method;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InterfaceAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.opensharingtoolkit.common.Record;
import org.opensharingtoolkit.common.Recorder;
import org.opensharingtoolkit.common.WifiUtils;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;
import android.media.AudioManager;
import android.media.AudioManager.OnAudioFocusChangeListener;
import android.media.MediaPlayer;
import android.media.MediaPlayer.OnCompletionListener;
import android.media.MediaPlayer.OnSeekCompleteListener;
import android.net.Uri;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Handler;
import android.os.Vibrator;
import android.preference.PreferenceManager;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;

/** Helper functions for javascript in Kiosk.
 * 
 * @author pszcmg
 *
 */
public class JavascriptHelper {
	private static final String TAG = "JavascriptHelper";
	private Context mContext;
	//private RedirectServer mRedirectServer;
	private Recorder mRecorder;
	private Map<String,MediaPlayer> mMediaPlayers = new HashMap<String,MediaPlayer>();
	private Handler mHandler = new Handler();
	
	public JavascriptHelper(Context context/*, RedirectServer redirectServer*/) {
		super();
		this.mContext = context;
		//this.mRedirectServer = redirectServer;
		mRecorder = new Recorder(mContext, "chooser.js.helper");
	}
	
	/** get local IP address/domain name for use in URLs by other machines on network;
	 * most likely wireless 
	 * 
	 * @return IP address (as string)
	 */
	@JavascriptInterface
	public String getHostAddress() {
		try {
			String address = SharedMemory.getInstance().getString("hostaddress");
			if (address!=null)
				return address;
			mRecorder.w("js.query.host.failed.notset", null);
		} catch (Exception e1) {
			Log.w(TAG,"Error getting hostaddress: "+e1, e1);
			mRecorder.w("js.query.host.failed.exception", null);
		}
		return "127.0.0.1";
	}
	@JavascriptInterface
	public int getPort() {
		return Service.getPort();
	}
	private Intent makeIntent(String url, String mimeTypeHint) {
		Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
		i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
		// NB i found that if you set mime type for PDF then adobe reader doesn't open the document.
		// not sure why at the moment...
		if(mimeTypeHint!=null)
			i.setType(mimeTypeHint);
		return i;
	}
	/** get hostname - probably only useful in captive portal mode */
	@JavascriptInterface
	public String getCaptiveportalHostname() {
		SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(mContext);
		return spref.getString("pref_hostname", "leaflets");
	}
	/** get safepreview setting, i.e. show only images as preview, don't open file(s) */
	@JavascriptInterface
	public boolean getSafePreview() {
		SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(mContext);
		return spref.getBoolean("pref_safepreview", false);
	}
	/** open/handle entry enclosure
	 * 
	 * @return true if handled
	 */
	@JavascriptInterface
	public boolean openUrl(String url, String mimeTypeHint) {
		Log.d(TAG,"openEntry("+url+","+mimeTypeHint);
		JSONObject jo = new JSONObject();
		try {
			jo.put("url", url);
			jo.put("mimeTypeHint", mimeTypeHint);
		}
		catch (Exception e) {
			Log.e(TAG,"Error marshalling openUrl info", e);
		}		
		if (canOpenUrl(url,mimeTypeHint)) {
			try {
				Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
				i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
				// NB i found that if you set mime type for PDF then adobe reader doesn't open the document.
				// not sure why at the moment...
				//if(mimeTypeHint!=null)
				//	i.setType(mimeTypeHint);
				mContext.startActivity(i);
				mRecorder.i("js.openUrl.success", jo);
				return true;
			} catch (Exception e) {
				Log.w(TAG,"Error opening "+url+" "+mimeTypeHint+" using intent", e);
				try {
					jo.put("exception", e.toString());
				}
				catch (Exception e2) {
					Log.e(TAG,"Error marshalling openUrl error info", e2);
				}
				mRecorder.i("js.openUrl.error", jo);
				return false;
			}
		}
		return false;
	}
	/** open/handle entry enclosure
	 * 
	 * @return true if handled
	 */
	@JavascriptInterface
	public boolean canOpenUrl(String url, String mimeTypeHint) {
		//Log.d(TAG,"openEntry("+url+","+mimeTypeHint);
		Intent i = makeIntent(url, mimeTypeHint);
		PackageManager packageManager = mContext.getPackageManager();
		List<ResolveInfo> activities = packageManager.queryIntentActivities(i, 0);
		if(activities.size() == 0) {
			Log.w(TAG,"No handler for intent "+url+" as "+mimeTypeHint);
			return false;
		} 
		Log.d(TAG,"- "+activities.size()+" activities match: ");
		for (int ai=0; ai<activities.size(); ai++)
			Log.d(TAG,"-- "+activities.get(ai).toString());
		return true;
	}
	
	/** get SSID of current wifi network.
	 * 
	 *  @return null if no network.
	 */
	@JavascriptInterface
	public String getWifiSsid() {
		try {
			String ssid = SharedMemory.getInstance().getString("ssid");
			if (ssid!=null)
				return ssid;
			mRecorder.w("js.query.wifiSsid.failed.notset", null);
		} catch (Exception e1) {
			Log.w(TAG,"Error getting wifiSsid: "+e1, e1);
			mRecorder.w("js.query.wifiSsid.failed.exception", null);
		}
		return "";
	}
	@JavascriptInterface
	public void registerMimeType(String path, String mimeType) {
		Service.registerExtension(path, mimeType);
	}
	@JavascriptInterface
	public void registerMimetypeCompat(String mimetype, String devicetype, String jsonCompat) {
		try {
			JSONObject compat = new JSONObject(jsonCompat);
			Boolean builtin = null;
			if (compat.has("builtin"))
				builtin = compat.getBoolean("builtin");
			JSONArray japps = compat.getJSONArray("apps");
			List<GetServer.App> apps = new LinkedList<GetServer.App>();
			for (int ix=0; ix<japps.length(); ix++) {
				JSONObject japp = japps.getJSONObject(ix);
				apps.add(new GetServer.App(japp.getString("name"), japp.getString("url")));
			}
			String userAgentPattern = null;
			if (compat.has("userAgentPattern"))
				userAgentPattern = compat.getString("userAgentPattern");
					
			GetServer.registerMimetypeCompat(mimetype, devicetype, userAgentPattern, builtin, apps);
		}
		catch (Exception e) {
			Log.e(TAG,"Error doing registerMimetypeCompat for "+mimetype+" for "+devicetype+" with "+jsonCompat+": "+e);
		}
	}
	/** register temporary redirect.
	 * 
	 *  @return Redirect path 
	 */
	@JavascriptInterface
	public String registerTempRedirect(String toUrl, long lifetimeMs) {
		String path = RedirectServer.singleton().registerTempRedirect(toUrl, lifetimeMs);
		JSONObject jo = new JSONObject();
		try {
			jo.put("toUrl", toUrl);
			jo.put("lifetime", lifetimeMs);
			jo.put("path", path);
		}
		catch (Exception e) {
			Log.w(TAG,"Error marshalling info for redirect", e);			
		}
		mRecorder.i("js.registerRedirect.dynamic", jo);
		return path;
	}
	/** register redirect.
	 * 
	 *  @return Redirect path 
	 */
	@JavascriptInterface
	public boolean registerRedirect(String fromPath, String toUrl, long lifetimeMs) {
		boolean res = RedirectServer.singleton().registerRedirect(fromPath, toUrl, lifetimeMs);
		JSONObject jo = new JSONObject();
		try {
			jo.put("toUrl", toUrl);
			jo.put("lifetime", lifetimeMs);
			jo.put("path", fromPath);
		}
		catch (Exception e) {
			Log.w(TAG,"Error marshalling info for redirect", e);			
		}
		mRecorder.i("js.registerRedirect.static", jo);
		return res;
	}
	/** register redirect for host
	 * 
	 *  @return Redirect path 
	 */
	@JavascriptInterface
	public boolean registerExternalRedirect(String fromHost, String fromPath, String toUrl, long lifetimeMs) {
		boolean res = RedirectServer.forHost(fromHost).registerRedirect(fromPath, toUrl, lifetimeMs);
		JSONObject jo = new JSONObject();
		try {
			jo.put("toUrl", toUrl);
			jo.put("lifetime", lifetimeMs);
			jo.put("path", fromPath);
			jo.put("host", fromHost);
		}
		catch (Exception e) {
			Log.w(TAG,"Error marshalling info for redirect", e);			
		}
		mRecorder.i("js.registerExternalRedirect.static", jo);
		return res;
	}
	/** get path of configured atom file
	 * 
	 * @return path
	 */
	@JavascriptInterface
	public String getAtomFile() {
		SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(mContext);
		String atomfile = spref.getString("pref_atomfile", "default.xml");
		JSONObject jo = new JSONObject();
		try {
			jo.put("filename", atomfile);
		}
		catch (Exception e) {
			Log.e(TAG,"Error marshalling getAtomFile info", e);	
		}
		mRecorder.i("js.query.atomFile", jo);
		return atomfile;
	}
	/** get current campaignid (from preferences)
	 * 
	 * @return path
	 */
	@JavascriptInterface
	public String getCampaignId() {
		SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(mContext);
		String campaignid = spref.getString("pref_campaignid", "");
		return campaignid;
	}
	/** get path prefix for local files
	 * 
	 * @return path
	 */
	@JavascriptInterface
	public String getLocalFilePrefix() {
		// should be on external storage
		File dir = Compat.getExternalFilesDir(mContext);
		if (dir==null) {
			mRecorder.i("js.query.localFilePrefix.error", null);
			Log.w(TAG, "getLocalFilePrefix with external storage not available");
			return null;
		}
		String url = dir.toURI().toString();
		if (url.endsWith("/"))
			url = url.substring(0, url.length()-1);
		if (url.startsWith("file:/") && !url.startsWith("file:///"))
			// extra //
			url = "file:///"+url.substring("file:/".length());
		JSONObject jo = new JSONObject();
		try {
			jo.put("url", url);
		}
		catch (Exception e) {
			Log.e(TAG,"Error marshalling getLocalFilePrefix info", e);	
		}
		mRecorder.i("js.query.localFilePrefix.success", jo);
		return url;
	}
	/** log to Record 
	 * 
	 */
	@JavascriptInterface
	public void record(int level, String event, String jsonInfo) {
		Record.logJson(mContext, level, "chooser.js", event, jsonInfo);
	}
	/** save shared state */
	@JavascriptInterface
	public boolean setShared(String key, String encoding, String value) {
		try {
			SharedMemory.Encoding enc = SharedMemory.Encoding.valueOf(encoding);
			SharedMemory.getInstance().put(key, enc, value);
			return true;
		}
		catch (Exception e) {
			Log.e(TAG,"Error setShared "+key+"=("+encoding+")"+value+": "+e);
			return false;
		}
	}
	/** get shared state 
	 * @return null or 2-element array with encoding, value */
	@JavascriptInterface
	public String getShared(String key) {
		Log.d(TAG,"getShared("+key+")");
		try {
			SharedMemory.Entry e = SharedMemory.getInstance().getEntry(key);
			if (e==null)
				return null;
			return e.encoding.toString()+":"+e.value;
		}
		catch (Exception e) {
			Log.e(TAG,"Error getShared "+key+": "+e);
			return null;
		}
	}
	private static final int MIN_VIBRATE = 200;
	@SuppressLint("NewApi")
	@JavascriptInterface
	public boolean vibrate(int duration) {
		SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(this.mContext);
		if (!spref.getBoolean("pref_vibrate", false)) {
			Log.d(TAG,"Ignore vibrate - no vibrate setting");
			return false;
		}
		try {
			if (duration < MIN_VIBRATE)
				duration = MIN_VIBRATE;
			// API level 11
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB) {
				Vibrator vib = (Vibrator) mContext.getSystemService(Context.VIBRATOR_SERVICE);
				if (vib.hasVibrator()) {
					Log.d(TAG,"vibrate "+duration);
					vib.vibrate(duration);
					return true;
				}
			}
			Log.d(TAG,"no vibrator");
			return false;
		}
		catch( Exception e ) {
			Log.e(TAG,"Error vibrate "+duration+": "+e);
			return false;
		}
	}
	@JavascriptInterface
	public boolean audioLoad(String url) {
		synchronized (mMediaPlayers) {
			MediaPlayer mp = mMediaPlayers.get(url);
			if (mp==null) {
				try {
					mp = new MediaPlayer();
					// not always, though
					mp.setAudioStreamType(AudioManager.STREAM_NOTIFICATION);
					if (url.startsWith("file:///android_asset/")) {
						try {
							AssetManager assets = mContext.getApplicationContext().getAssets();
							AssetFileDescriptor fd = assets.openFd(url.substring("file:///android_asset/".length()));
							mp.setDataSource(fd.getFileDescriptor(), fd.getStartOffset(), fd.getDeclaredLength());
							mp.prepare();
							fd.close();
						}
						catch (Exception e) {
							Log.e(TAG,"Error getting audio asset "+url+": "+e);
							return false;
						}
					}
					else {
						mp.setDataSource(mContext, Uri.parse(url));
						mp.prepareAsync();
					}
					mMediaPlayers.put(url, mp);
					mp.setOnSeekCompleteListener(new OnSeekCompleteListener() {
						@Override
						public void onSeekComplete(MediaPlayer mp) {
							Log.d(TAG,"play on seek complete");
							mp.setVolume(1, 1);
							mp.start();
						}
					});
					// audio focus - API level 8
//					mp.setOnCompletionListener(new OnCompletionListener() {
//						@Override
//						public void onCompletion(MediaPlayer mp) {
//							Log.d(TAG,"completed audio");
//							synchronized (this) {
//								if (mHasAudioFocus) {
//									mHasAudioFocus = false;
//									// Note: we'll try to release each time (and re-gain next time) 
//									// because otherwise we still lose the start of the first sound
//									// after a pause due to output device selection delay
//									try {
//										AudioManager audioManager = (AudioManager) mContext.getSystemService(Context.AUDIO_SERVICE);
//										audioManager.abandonAudioFocus(JavascriptHelper.this);
//										Log.d(TAG,"release audio focus");
//									}
//									catch (Exception e)  {
//										Log.e(TAG,"error releasing audio focus: "+e);
//									}
//								}
//							}
//						}
//					});
					Log.d(TAG,"Created MediaPlayer for "+url);
					return true;
				}
				catch (Exception e ){
					Log.e(TAG,"Error creating media player for "+url+": "+e);
				}
			}
		}
		return false;
	}
	private MediaPlayer mMediaPlayer;
	private boolean mHasAudioFocus;
	@JavascriptInterface
	public boolean audioPlay(String url) {
		SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(this.mContext);
		if (!spref.getBoolean("pref_click", false)) {
			Log.d(TAG,"Ignore audio "+url+" - no click setting");
			return false;
		}

		audioLoad(url);
		synchronized (mMediaPlayers) {
			MediaPlayer mp = mMediaPlayers.get(url);
			if (mp!=null) {
				// Audio focus - API level 8
//				try {
//					AudioManager audioManager = (AudioManager) mContext.getSystemService(Context.AUDIO_SERVICE);
//					boolean hasFocus = false;
//					synchronized (this) {
//						mMediaPlayer = mp;
//						hasFocus = mHasAudioFocus;
//					}
//					if (hasFocus) {
						audioPlayInternal(); 
//					} else {
//						int result = audioManager.requestAudioFocus(this, AudioManager.STREAM_NOTIFICATION,
//						    AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK);
//	
//						if (result != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
//							Log.d(TAG,"Could not get audio focus");
//						}
//						else {
//							Log.d(TAG,"received audio focus");
//							synchronized(this) {
//								mHasAudioFocus = true;
//							}
//							audioPlayInternal();
//						}
//					}
//				}
//				catch (Exception e) {
//					Log.e(TAG,"Error getting audio focus: "+e);
//				}
			}
			else
				Log.d(TAG,"Could not play audio "+url+" - could not make player");
		}
		return false;
	}
	private void audioPlayInternal() {
		try {
			synchronized (this) {
				if (mMediaPlayer!=null && mMediaPlayer.isPlaying())
					mMediaPlayer.pause();
				if (mMediaPlayer.getCurrentPosition()==0) {
					mMediaPlayer.setVolume(1, 1);
					mMediaPlayer.start();
				}
				else {
					mMediaPlayer.seekTo(0);
					// play in seek
					//mMediaPlayer.start();
				}
			}
		} catch (Exception e) {
			Log.e(TAG,"Error playing audio (internal): "+e);
		}
	}

	// API level 8
//	private class AudioFocusListener implements OnAudioFocusChangeListener {
//		@Override
//		public void onAudioFocusChange(int focusChange) {
//			if (focusChange==AudioManager.AUDIOFOCUS_GAIN) {
//				Log.d(TAG,"audio gained focus");
//				audioPlayInternal();
//			} else {
//				Log.d(TAG,"audio lost focus ("+focusChange+")");
//				// give up
//				synchronized (this) {
//					if (mMediaPlayer!=null && mMediaPlayer.isPlaying())
//						mMediaPlayer.pause();
//					mHasAudioFocus = false;
//				}
//			}
//		}
//	}
	@JavascriptInterface
	public void dimScreen(boolean dim) {
		try {
			int lowBrightness = 0;
			SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(mContext);
			try {
				lowBrightness = Integer.valueOf(spref.getString("pref_lowbrightness", Integer.toString(lowBrightness)));
			}
			catch (Exception e){
				Log.w(TAG,"Error parsing lowbrightness", e);
			}
			if (lowBrightness>100)
				lowBrightness = 100;
			if (lowBrightness<0)
				lowBrightness = 0;
			int highBrightness = 100;
			try {
				highBrightness = Integer.valueOf(spref.getString("pref_highbrightness", Integer.toString(highBrightness)));
			}
			catch (Exception e){
				Log.w(TAG,"Error parsing highBrightness", e);
			}
			if (highBrightness>100)
				highBrightness = 100;
			if (highBrightness<0)
				highBrightness = 0;
			float brightness = dim ? lowBrightness*0.01f : highBrightness*0.01f;
			final Intent i = new Intent(MainActivity.ACTION_SET_BRIGHTNESS);
			i.setClass(mContext, MainActivity.class);
			i.putExtra(MainActivity.EXTRA_BRIGHTNESS, brightness);
			mHandler.post(new Runnable() {
				public void run() {
					Log.d(TAG,"Delayed set brightness");
					mContext.startActivity(i);
				}
			});
		} catch (Exception e) {
			Log.e(TAG,"Error setting screenBrightness: "+e, e);
		}
	}
}
