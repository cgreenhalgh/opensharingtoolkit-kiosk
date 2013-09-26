/**
 * 
 */
package org.opensharingtoolkit.kiosk;

import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;

import org.opensharingtoolkit.httpserver.HttpContinuation;
import org.opensharingtoolkit.httpserver.HttpError;
import org.opensharingtoolkit.httpserver.HttpListener;

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

	private static final String TAG = "kiosk-service";
	private static final int SERVICE_NOTIFICATION_ID = 1;
	private HttpListener httpListener = null;
	private static final int HTTP_PORT = 8080;
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
		// TODO Auto-generated method stub
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
		// TODO Auto-generated method stub
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
		// TODO Auto-generated method stub
		return null;
	}

	public void postRequest(String path, String requestBody,
			HttpContinuation httpContinuation) throws IOException, HttpError {
		if (path.startsWith("/"))
			path = path.substring(1);
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
			String extension = filename.substring(ix+1).toLowerCase();
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
			else if (extension.equals("pdf"))
				mimeType = "application/pdf";
			else
				Log.w(TAG,"Unknown file extension "+extension+" (get "+path+")");
		}			
		Log.d(TAG,"Sending "+path+" as "+mimeType);
		// TODO Auto-generated method stub
		AssetManager assets = getApplicationContext().getAssets();
		InputStream content = null;
		try {
			content = assets.open(path);
		} catch (IOException e) {
			Log.w(TAG,"Error opening asset "+path, e);
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		if (content!=null) {
			// guess mime type
			httpContinuation.done(200, "OK", mimeType, -1, content);
		}
		else
			httpContinuation.done(404, "File not found", "text/plain", -1, null);
	}
}
