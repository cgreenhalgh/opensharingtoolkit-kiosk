/**
 * Copyright (c) 2012 The University of Nottingham
 * 
 * @author Chris Greenhalgh (cmg@cs.nott.ac.uk), The University of Nottingham
 */

package org.opensharingtoolkit.httpserver;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.Socket;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import org.json.JSONObject;
import org.opensharingtoolkit.chooser.Service;
import org.opensharingtoolkit.common.Recorder;

import android.util.Log;

/**
 * @author cmg
 *
 */
public class HttpClientHandler extends Thread {
	private static final String TAG = "kiosk-httpclient";
	private Service service;
	private Socket s;
	private int mStatus = 0;
	private String mMessage = null;
	private long mResponseLength = -1;
	private InputStream mResponseContent = null;
	private String mMimeType = null;
	private Map<String, String> mExtraHeaders;
	private Recorder mRecorder = null;
	
	public HttpClientHandler(Service service, Socket s) {
		this.service = service;
		this.s = s;
		mRecorder = new Recorder(service, "http");
	}
	
	public void run() {
		try {
			// parse request
			BufferedInputStream bis = new BufferedInputStream(s.getInputStream());
			//InputStreamReader isr = new InputStreamReader(bis, "US-ASCII");
			// request line
			String request = readLine(bis);
			//Log.d(TAG,"Request: "+request);
			String requestEls[] = request.split(" ");
			if (requestEls.length!=3) 
				throw HttpError.badRequest("Mal-formatted request line ("+requestEls.length+" elements)");
			String method = requestEls[0];
			String path = requestEls[1];
			// header lines
			HashMap<String,String> headers = new HashMap<String,String>();
			while (true) {
				String header = readLine(bis);
				if (header.length()==0)
					break;
				//Log.d(TAG,"Header line: "+header);
				int ix = header.indexOf(":");
				if (ix<0) 
					throw HttpError.badRequest("Mal-formed header line ("+header+")");
				String name = header.substring(0,ix).trim().toLowerCase(Locale.US);
				String value = header.substring(ix+1).trim();
				headers.put(name, value);
			}
			String host = headers.get("host");
			if (host==null) 
				throw HttpError.badRequest("Host not specified");
			// DNS is case-insensitive
			host = host.toLowerCase(Locale.US);
			
			//if (!"GET".equals(requestEls[0]) && !"POST".equals(requestEls[0]))
			//	throw HttpError.badRequest("Unsupported operation ("+requestEls[0]+")");
			Log.d(TAG,"Request: host "+host+" "+request);
			// content body
			int length = -1;
			String contentLength = headers.get("content-length");
			if (contentLength!=null)
				try {
					length = Integer.parseInt(contentLength);
				}
				catch (NumberFormatException nfe) {
					throw HttpError.badRequest("Invalid content-length ("+contentLength+")");
				}
			//Log.d(TAG,"Read request body "+length+" bytes");
			byte buf[] = new byte[length>=0 ? length : 1000];
			int count = 0;
			// no length => no content?!
			while (count<length) {
				int n = bis.read(buf, count, buf.length-count);
				if (n<0) {
					if (length<0)
						break;
					else
						throw HttpError.badRequest("Request body too short ("+count+"/"+length+")");
				}
				count += n;
				if (length<0 && count>=buf.length) {
					// grow buffer
					byte nbuf[] = new byte[buf.length*2];
					System.arraycopy(buf, 0, nbuf, 0, count);
					buf = nbuf;
				}
			}
			String requestBody = new String(buf,0,count,"UTF-8");
			
			String userAgent = headers.get("user-agent");
			String referer = headers.get("referer");
			JSONObject info = new JSONObject();
			final String remoteAddress = s.getInetAddress().getHostAddress();
			try {
				info.put("method", method);
				info.put("userAgent", userAgent);
				info.put("referer", referer);
				info.put("path", path);
				info.put("host", host);
				info.put("requestLength", requestBody.length());
				info.put("localPort", s.getLocalPort());
				info.put("remotePort", s.getPort());
				info.put("remoteAddress", remoteAddress);
			} catch (Exception e) {
				Log.e(TAG,"Error marshalling request record info", e);
			}
			mRecorder.i("http.request", info);
			
			synchronized (this) {
				try {
					service.postRequest(method, host, path, headers, requestBody, new HttpContinuation() {
	
						public void done(int status, String message, String mimeType, long length, InputStream content, Map<String,String> extraHeaders) {
							Log.d(TAG,"http done: status="+status+", message="+message+", length="+length);
							JSONObject info = new JSONObject();
							try {
								info.put("remotePort", s.getPort());
								info.put("remoteAddress", remoteAddress);
								info.put("status", status);
								info.put("message", message);
								info.put("mimeType", mimeType);
								info.put("responseLength", length);
								if (extraHeaders!=null && extraHeaders.containsKey("Location"))
									info.put("redirectLocation", extraHeaders.get("Location"));
							} catch (Exception e) {
								Log.e(TAG,"Error marshalling request record info", e);
							}
							mRecorder.i("http.response", info);
	
							mStatus = status;
							mMimeType = mimeType;
							mMessage = message;
							mResponseLength = length;
							mResponseContent = content;
							mExtraHeaders = extraHeaders;
							synchronized (HttpClientHandler.this) {
								HttpClientHandler.this.notify();
							}
						}
						
					});
					// timeout 10s?!
					try {
						if (mStatus==0)
							wait(10000);
					} 
					catch (InterruptedException ie) {
						throw HttpError.serverError("Handle request interrupted");
					}
				}
				catch (HttpError http) {
					throw http;
				}
				catch (Exception e) {
					Log.w(TAG,"Error handling request "+method+" "+path, e);
					throw HttpError.serverError("Internal server error");
				}
				catch (Error e) {
					Log.w(TAG,"Error handling request "+method+" "+path, e);
					throw HttpError.serverError("Internal server error");
				}
			}
			if (mStatus==0)
				throw HttpError.serverError("Handle request timed out");

			OutputStream os = s.getOutputStream();
			BufferedOutputStream bos = new BufferedOutputStream(os);
			OutputStreamWriter osw = new OutputStreamWriter(bos, "US-ASCII");
			osw.write("HTTP/1.0 "+mStatus+" "+mMessage+"\r\n");
			if (mResponseLength>=0)
				osw.write("Content-Length: "+mResponseLength+"\r\n");
			else if (mResponseContent==null)
				osw.write("Content-Length: 0\r\n");	
			osw.write("Content-Type: "+mMimeType+"\r\n");
			if (mExtraHeaders!=null) {
				for (Map.Entry<String, String> hs : mExtraHeaders.entrySet()) 
					osw.write(hs.getKey()+": "+hs.getValue()+"\r\n");
			}
			osw.write("\r\n");
			osw.flush();
			byte rbuf[] = new byte[250000];
			int rcnt = 0;
			if (mResponseLength!=0 && mResponseContent!=null) {
				while (true) {
					rcnt = mResponseContent.read(rbuf);
					if (rcnt<=0)
						break;
					os.write(rbuf, 0, rcnt);
				}
			}
			if (mResponseContent!=null){
				try {
					mResponseContent.close();
				}
				catch (Exception e) {
					Log.w(TAG,"Closing mResponseContent", e);
				}
			}
			//bos.write(resp);
			os.close();
			Log.d(TAG,"Sent "+mStatus+" "+mMessage+" ("+mResponseLength+" bytes)");
			JSONObject info2 = new JSONObject();
			try {
				info2.put("remotePort", s.getPort());
				info2.put("remoteAddress", remoteAddress);
			} catch (Exception e) {
				Log.e(TAG,"Error marshalling request record info", e);
			}
			mRecorder.i("http.response.complete", info2);
		}
		catch (IOException ie) {
			Log.d(TAG,"Error: "+ie.getMessage());
			JSONObject info = new JSONObject();
			try {
				info.put("exception", ie.toString());
				info.put("localPort", s.getLocalPort());
				info.put("remotePort", s.getPort());
				info.put("remoteAddress", s.getInetAddress().getHostAddress());
			}
			catch (Exception e) {
				Log.e(TAG,"Error marshalling request error info", e);				
			}
			mRecorder.w("http.error", info);
		} catch (HttpError e) {
			Log.d(TAG,"Sending error: "+e.getMessage());
			JSONObject info = new JSONObject();
			try {
				info.put("status", e.getStatus());
				info.put("message", e.getMessage());
				info.put("localPort", s.getLocalPort());
				info.put("remotePort", s.getPort());
				info.put("remoteAddress", s.getInetAddress().getHostAddress());
			}
			catch (Exception e2) {
				Log.e(TAG,"Error marshalling request http error info", e);				
			}
			mRecorder.w("http.response.error", info);

			sendError(e.getStatus(), e.getMessage());
		}
		try {
			s.close();
		}
		catch (IOException e) {
			/* ignore */
		}
	}

	private void sendError(int status, String message) {
		try {
			BufferedOutputStream bos = new BufferedOutputStream(s.getOutputStream());
			OutputStreamWriter osw = new OutputStreamWriter(bos, "US-ASCII");
			osw.write("HTTP/1.0 "+status+" "+message+"\r\n");
			osw.write("Content-type: text/plain\r\n");
			osw.write("\r\n");
			osw.write("Something went wrong: "+message+" (HTTP status code "+status+")\n");
			osw.close();
		} catch (Exception e) {
			Log.d(TAG,"Error sending error: "+e.getMessage());
			/* ignore */
		}
	}

/*	private String readLine(InputStreamReader isr) throws IOException {
		StringBuilder sb = new StringBuilder();
		while (true) {
			int c = isr.read();
			if (c<0)
				break;
			if (c=='\r')
				// skip
				continue;
			if (c=='\n')
				break;
			sb.append((char)c);
		}
		return sb.toString();
	}
*/
	private String readLine(BufferedInputStream bis) throws IOException {
		StringBuilder sb = new StringBuilder();
		while (true) {
			int c = bis.read();
			if (c<0)
				break;
			if (c=='\r')
				// skip
				continue;
			if (c=='\n')
				break;
			sb.append((char)c);
		}
		return sb.toString();
	}

}
