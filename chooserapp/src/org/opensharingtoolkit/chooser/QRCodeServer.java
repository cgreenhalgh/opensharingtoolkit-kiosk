/**
 * 
 */
package org.opensharingtoolkit.chooser;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import org.opensharingtoolkit.httpserver.HttpContinuation;
import org.opensharingtoolkit.httpserver.HttpError;
import org.opensharingtoolkit.httpserver.HttpUtils;

import android.graphics.Bitmap;
import android.graphics.Bitmap.CompressFormat;
import android.util.Log;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;

/**
 * @author pszcmg
 *
 */
public class QRCodeServer {
	private static final int WHITE = 0xFFFFFFFF;
	private static final int BLACK = 0xFF000000;

	private static String TAG = "qrcodeserver";
	private static final String PARAM_URL = "url";
	private static final String PARAM_SIZE = "size";

	private static int CACHE_SIZE = 100;
	private static Map<String,byte[]> cache = new HashMap<String,byte[]>();
	private static List<String> codes = new LinkedList<String>();
	
	/** parse request and return QRCode 
	 * @throws HttpError */
	public static void handleRequest(String path,
			HttpContinuation httpContinuation) throws HttpError {
		Hashtable<String,String> params = HttpUtils.getParams(path);
		if (params==null) {
			Log.w(TAG,"request qr code without parameters: "+path);
			throw HttpError.badRequest("QRCodeServer expected URL-encoded parameters");
		}
		if (params.containsKey(PARAM_URL)) {
			String url = params.get(PARAM_URL);
			int size = 0;
			try {
				if (params.containsKey(PARAM_SIZE))
					size = Integer.parseInt(params.get(PARAM_SIZE));
			}
			catch (Exception e) {
				Log.w(TAG,"Erroring reading size parameteer: "+e);
			}
			byte[] image = null;
			synchronized (QRCodeServer.class) {
				image = cache.get(url);
			}
			if (image==null) {
				image = buildQRCodeForUrl(url, size, httpContinuation);
				synchronized (QRCodeServer.class) {
					cache.put(url, image);
					codes.add(url);
					while (codes.size()>CACHE_SIZE) {
						String oldUrl = codes.remove(0);
						cache.remove(oldUrl);
						Log.d(TAG,"Discard from cache "+oldUrl);
					}
				}
			} else
				Log.d(TAG,"Server qrcode from cache: "+url);
		    httpContinuation.done(200, "OK", "image/png", image.length, new ByteArrayInputStream(image), null);
		    return;
		}
		Log.w(TAG,"no url parameter: "+path);
		throw HttpError.badRequest("missing expected parameter(s)");
	}

	private static byte[] buildQRCodeForUrl(String url,
			int size, HttpContinuation httpContinuation) throws HttpError {
		Log.i(TAG,"get qrcode: "+url);
	    BitMatrix result;
	    try {
		    Map<EncodeHintType,Object> hints = null;
	      result = new MultiFormatWriter().encode(url, BarcodeFormat.QR_CODE, size, size, hints);
	    } catch (IllegalArgumentException iae) {
	    	// Unsupported format
	    	throw new HttpError(500,"Problem encoding url: "+iae.getMessage());
	    } catch (WriterException we) {
	    	throw new HttpError(500,"Problem encoding url: "+we.getMessage());
		}
	    int width = result.getWidth();
	    int height = result.getHeight();
	    int[] pixels = new int[width * height];
	    for (int y = 0; y < height; y++) {
	      int offset = y * width;
	      for (int x = 0; x < width; x++) {
	        pixels[offset + x] = result.get(x, y) ? BLACK : WHITE;
	      }
	    }
	    Log.d(TAG,"qrcode is "+width+"x"+height);
	    Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
	    bitmap.setPixels(pixels, 0, width, 0, 0, width, height);
	    ByteArrayOutputStream stream = new ByteArrayOutputStream();
	    bitmap.compress(CompressFormat.PNG, 100, stream);
	    byte[] image = stream.toByteArray();
	    Log.d(TAG,"qrcode as PNG is "+image.length+" bytes");
	    return image;
	}
}
