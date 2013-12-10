/**
 * 
 */
package org.opensharingtoolkit.chooser;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;

import org.opensharingtoolkit.httpserver.HttpContinuation;
import org.opensharingtoolkit.httpserver.HttpError;
import org.opensharingtoolkit.httpserver.HttpListener;
import org.opensharingtoolkit.chooser.R;

import android.app.Notification;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;
import android.os.IBinder;
import android.util.Log;

/**
 * @author pszcmg
 *
 */
public class Service extends android.app.Service {

	private IBinder mBinder = new LocalBinder();
	
	private static final String TAG = "kiosk-service";
	private static final int SERVICE_NOTIFICATION_ID = 1;
	private HttpListener httpListener = null;
	public static final int HTTP_PORT = 8080;
	@Override
	public void onCreate() {
		super.onCreate();
		
		Log.d(TAG,"service onCreate");
		
		// notification
		Notification notification = new Notification.Builder(getApplicationContext())
				.setContentTitle(getText(R.string.notification_title))
				.setContentText(getText(R.string.notification_description))
				.setSmallIcon(R.drawable.notification_icon)
				.setContentIntent(PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class), 0))
				.build();

		startForeground(SERVICE_NOTIFICATION_ID, notification);
				
		httpListener = new HttpListener(this, HTTP_PORT);
		httpListener.start();
	}

	@Override
	public void onDestroy() {
		Log.d(TAG,"service onDestroy");
		super.onDestroy();
		
		stopForeground(true);
		
		if (httpListener!=null) {
			try {
				httpListener.close();
			} catch (Exception e) {
				Log.d(TAG,"error closing httplistener", e);
			}
			httpListener = null;
		}
	}

	// starting service...
	private void handleCommand(Intent intent) {
		Log.d(TAG,"handleCommand "+intent.getAction());
	}

	// This is the old onStart method that will be called on the pre-2.0
	// platform.  On 2.0 or later we override onStartCommand() so this
	// method will not be called.
	@Override
	public void onStart(Intent intent, int startId) {
	    handleCommand(intent);
	}

	@Override
	public int onStartCommand(Intent intent, int flags, int startId) {
	    handleCommand(intent);
	    // We want this service to continue running until it is explicitly
	    // stopped, so return sticky.
	    return START_STICKY;
	}

	/* (non-Javadoc)
	 * @see android.app.Service#onBind(android.content.Intent)
	 */
	@Override
	public IBinder onBind(Intent arg0) {
		return mBinder;
	}
	/** Binder subclass (inner class) with methods for local interaction with service */
	public class LocalBinder extends android.os.Binder {
		// local methods... direct access to service
		public Service getService() {
			return Service.this;
		}
	}
	
	public void postRequest(String path, String requestBody,
			HttpContinuation httpContinuation) throws IOException, HttpError {
		if (path.startsWith("/a/"))
			handleAssetRequest(path.substring("/a".length()), requestBody, httpContinuation);
		else if (path.startsWith("/f/"))
			handleFileRequest(path.substring("/f".length()), requestBody, httpContinuation);
		else if (path.startsWith("/qr?"))
			QRCodeServer.handleRequest(path, httpContinuation);
		else if (path.startsWith("/r/")) 
			RedirectServer.singleton().handleRequest(path, httpContinuation);
		else
			httpContinuation.done(404, "File not found", "text/plain", -1, null, null);		
	}
	private String checkPath(String path) {
		if (path.startsWith("/"))
			path = path.substring(1);
		int qix = path.indexOf("?");
		if (qix>=0)
			path = path.substring(0,qix);
		return path;
	}
	private String guessMimeType(String path) throws HttpError {
		int ix = path.lastIndexOf('/');
		String mimeType = "application/unknown";
		String filename = path;
		if (ix>=0)
		{
			filename = path.substring(ix+1);
		}
		if (filename.length()==0)
			throw new HttpError(403, "Access denied");
		ix = filename.lastIndexOf(".");
		if (ix>=0) {
			String extension = filename.substring(ix+1).toLowerCase(Locale.US);
			if (extension.equals("html") || extension.equals("htm"))
				mimeType = "text/html";
			else if (extension.equals("xml"))
				mimeType = "text/xml";
			else if (extension.equals("jpg"))
				mimeType = "image/jpg";
			else if (extension.equals("js"))
				mimeType = "text/javascript";
			else if (extension.equals("css"))
				mimeType = "text/css";
			else if (extension.equals("png"))
				mimeType = "image/png";
			else if (extension.equals("gif"))
				mimeType = "image/gif";
			else if (extension.equals("pdf"))
				mimeType = "application/pdf";
			else
				Log.w(TAG,"Unknown file extension "+extension+" (get "+path+")");
		}			
		Log.d(TAG,"Sending "+path+" as "+mimeType);
		return mimeType;
	}
	private void handleAssetRequest(String path, String requestBody,
			HttpContinuation httpContinuation) throws IOException, HttpError {
		path = checkPath(path);
		String mimeType = guessMimeType(path);
		AssetManager assets = getApplicationContext().getAssets();
		// try hard to get asset size
		long length = -1;
		try {
			AssetFileDescriptor afd = assets.openFd(path);
			length = afd.getDeclaredLength();
			if (length==AssetFileDescriptor.UNKNOWN_LENGTH)
				length = -1;
		}
		catch (Exception e) {
			Log.d(TAG,"Anticipated error opening "+path+": "+e.getMessage());
		}
		if (length<0) {
			// try again 
			try {			
				// first, length
				InputStream content = assets.open(path);
				byte buf[] = new byte[10000];
				length = 0;
				while(true) {
					long cnt = content.read(buf);
					if (cnt>0)
						length += cnt;
					else
						break;
				}
				content.close();
			} catch (IOException e) {
				Log.w(TAG,"Error opening asset "+path, e);
			}
		}
		// content
		InputStream content = null;
		try {
			content = assets.open(path);
		} catch (IOException e) {
			Log.w(TAG,"Error opening asset "+path, e);
		}
		if (content!=null) {
			// guess mime type
			httpContinuation.done(200, "OK", mimeType, length, content, null);
		}
		else {
			Log.d(TAG,"Content not found");
			httpContinuation.done(404, "File not found", "text/plain", 0, null, null);
		}
	}
	private void handleFileRequest(String path, String requestBody,
			HttpContinuation httpContinuation) throws IOException, HttpError {
		path = checkPath(path);
		if (path.contains(".."))
			throw new HttpError(403, "Access denied");
			
		String mimeType = guessMimeType(path);
		File dir = getExternalFilesDir(null);
		if (dir==null) {
			Log.w(TAG, "handleFileRequest with external storage not available");
			throw new HttpError(404, "File not found");
		}
		File file = new File(dir, path);
		// 0 if doesn't exist
		long length = file.length();
		InputStream content = null;
		try {
			content = new FileInputStream(file);
		}
		catch (IOException e) {
			Log.d(TAG,"File not found: "+file);
			throw new HttpError(403,"File not found");
		}
		httpContinuation.done(200, "OK", mimeType, length, content, null);
	}
}
