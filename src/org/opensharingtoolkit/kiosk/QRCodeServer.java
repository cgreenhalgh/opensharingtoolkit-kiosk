/**
 * 
 */
package org.opensharingtoolkit.kiosk;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.Hashtable;
import java.util.Map;

import org.opensharingtoolkit.httpserver.HttpContinuation;
import org.opensharingtoolkit.httpserver.HttpError;

import android.graphics.Bitmap;
import android.graphics.Bitmap.CompressFormat;
import android.util.Log;
import android.util.Xml.Encoding;

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

	/** parse request and return QRCode 
	 * @throws HttpError */
	public static void handleRequest(String path,
			HttpContinuation httpContinuation) throws HttpError {
		int ix = path.indexOf("?");
		if (ix<0) {
			Log.w(TAG,"request qr code without parameters: "+path);
			throw HttpError.badRequest("QRCodeServer expected URL-encoded parameters");
		}
		String paramStrings[] = path.substring(ix+1).split("&");
		Hashtable<String,String> params = new Hashtable<String,String>();
		for (String p : paramStrings) {
			int eix = p.indexOf("=");
			if (eix<0)
				params.put(p, p);
			else if (eix==0) {
				Log.w(TAG,"parameter name missing: "+path);
				throw HttpError.badRequest("parameter name missing ("+p+")");
			} else
				try {
					params.put(p.substring(0,eix), URLDecoder.decode(p.substring(eix+1), "UTF-8"));
				} catch (UnsupportedEncodingException e) {
			    	throw new HttpError(500,"Problem decoding parameters: "+e.getMessage());
				}
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
			buildQRCodeForUrl(url, size, httpContinuation);
			return;
		}
		Log.w(TAG,"no url parameter: "+path);
		throw HttpError.badRequest("missing expected parameter(s)");
	}

	private static void buildQRCodeForUrl(String url,
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
	    httpContinuation.done(200, "OK", "image/png", image.length, new ByteArrayInputStream(image), null);
	}
}
