/**
 * 
 */
package org.opensharingtoolkit.chooser;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Vector;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.AssetFileDescriptor;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Handler;
import android.preference.PreferenceManager;
import android.util.Log;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

/**
 * @author pszcmg
 *
 */
public class ZipHandlerActivity extends Activity {

	private static final String TAG = "chooser-zip";
	private TextView log;
	
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		// TODO Auto-generated method stub
		super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_zip_handler);
        log = (TextView)findViewById(R.id.zip_handler_log);
        final Button replace = (Button)findViewById(R.id.buttonReplace);
        replace.setOnClickListener(new OnClickListener() {
			@Override
			public void onClick(View v) {
				Log.d(TAG,"Click replace....");
				replace.setEnabled(false);
				Intent i = getIntent();
				Log.i(TAG,"onCreate action="+i.getAction()+", data="+i.getData());
				startUnzip(i.getData());
			}
		});
        final Button reload = (Button)findViewById(R.id.buttonReload);
        reload.setOnClickListener(new OnClickListener() {
			@Override
			public void onClick(View v) {
				Log.d(TAG,"Click reload....");
				replace.setEnabled(false);
				Intent i = new Intent();
				i.setAction(MainActivity.ACTION_RELOAD);
				i.setClass(getApplicationContext(), MainActivity.class);
				startActivity(i);
			}
		});
	}

	static class Unzip {
		Uri data;
		File dir;
		/**
		 * @param data
		 * @param dir
		 */
		public Unzip(Uri data, File dir) {
			super();
			this.data = data;
			this.dir = dir;
		}
		public Uri getData() {
			return data;
		}
		public File getDir() {
			return dir;
		}
	}
	static class Result {
		Vector<String> errors = new Vector<String>();
		Vector<String> configFiles = new Vector<String>();
	}
	private UnzipTask task;
	private void startUnzip(Uri data) {
		// TODO Auto-generated method stub
		log.append("Try to unzip "+data.toString()+"\n");
		File dir = Compat.getExternalFilesDir(this);
		if (dir==null) {
			Log.w(TAG, "getExternalFilesDir with external storage not available");
			log.append("Could not get application directory to unzip into");
			return;
		}
		task = new UnzipTask();
		log.append("Working...");
		task.execute(new Unzip(data, dir));
	}
	
	/**
	 * 
	 * @param is
	 * @param dir
	 * @return top-level .xml files found
	 * @throws IOException
	 */
	// http://stackoverflow.com/questions/3382996/how-to-unzip-files-programmatically-in-android
	private static Vector<String>  unzip(InputStream is, File dir) throws IOException {
		String cdir = dir.getCanonicalPath();
		Vector<String> fnames = new Vector<String>();
        ZipInputStream zis = new ZipInputStream(new BufferedInputStream(is));          
        ZipEntry ze;
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024*1024];
        int count;

        while((ze = zis.getNextEntry()) != null) 
        {
            String filename = ze.getName();
            Log.d(TAG,"Unzip file "+filename);
            File file = new File(dir, filename);

            if (!file.getCanonicalPath().startsWith(cdir)) 
            	throw new IOException("File would be outside unzip directory: "+file.getCanonicalPath());
        	if (ze.isDirectory()) {
        		if (!file.exists()) {
                	Log.i(TAG,"Create directory(s) "+file);
                	if (!file.mkdirs())
                		throw new IOException("Could not create directory "+file);
        		}
        		// otherwise ignore
        		continue;
        	}

            File parent = file.getParentFile();
            if (!parent.exists()) {
            	Log.i(TAG,"Create directory(s) "+parent);
            	if (!parent.mkdirs())
            		throw new IOException("Could not create directory "+parent);
            }
            FileOutputStream fout = new FileOutputStream(new File(dir, filename));

            // reading and writing
            while((count = zis.read(buffer)) != -1) 
            {
                baos.write(buffer, 0, count);
                byte[] bytes = baos.toByteArray();
                fout.write(bytes);             
                baos.reset();
            }

            fout.close();               
            zis.closeEntry();
            
            if (parent.getCanonicalPath().equals(cdir) && filename.endsWith(".xml")) {
            	Log.d(TAG,"Found top-level .xml file "+filename);
            	fnames.add(file.getName());
            }
        }

        zis.close();
        
        return fnames;
    }
	
	private class UnzipTask extends AsyncTask<Unzip, Integer, Result> {

		@Override
		protected Result doInBackground(Unzip... unzips) {
			Result res = new Result();
            // can we read it?
			for (Unzip unzip : unzips) {
				Uri uri = unzip.getData();
				try {
					AssetFileDescriptor afd = getContentResolver().openAssetFileDescriptor(uri, "r");
					try {
						Log.d(TAG,"Asset length="+afd.getLength()+", declaredLength="+afd.getDeclaredLength());
						InputStream is = afd.createInputStream();
						res.configFiles.addAll(unzip(is, unzip.getDir()));
						// TODO
					} finally {
						afd.close();
					}
				} catch (FileNotFoundException nfe) {
					Log.w(TAG,"Error opening content "+uri+": "+nfe);
					res.errors.add("Error: "+nfe);
				} catch (IOException ioe) {
					Log.w(TAG,"Error reading content "+uri+": "+ioe);
					res.errors.add("Error: "+ioe);
				}
			}
			return res;
		}

		@Override
		protected void onPostExecute(Result result) {
			if (this.isCancelled())
				return;
	        final Button reload = (Button)findViewById(R.id.buttonReload);
	        reload.setEnabled(true);
			for (String error: result.errors)
				log.append(error);
			if (result.errors.size()==0) {
				log.append("Extracted OK\n");
				for (String fname: result.configFiles)
					log.append("Found config file: "+fname+"\n");				
			    if (result.configFiles.size()>0) {
			    	String atomfile = result.configFiles.get(0);
			    	log.append("Setting atomfile to "+atomfile+"\n");
			    	//pref_atomfile
			    	try {
						SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(ZipHandlerActivity.this);
						spref.edit().putString("pref_atomfile", atomfile).commit();
						Log.i(TAG, "Set pref_atomfile to "+atomfile);
						//new Handler().postDelayed(new Runnable() {
						//	public void run() {
						//		Log.i(TAG, "finish");
						//		ZipHandlerActivity.this.finish();
						//	}
						//}, 1000);
						Log.i(TAG, "Long press the top-left corner of the chooser screen to reload the configuration\n");
			    	}
			    	catch (Exception e) {
			    		Log.w(TAG,"Error setting atomfile in preferences: "+e);
			    	}
				}
			}
	    	log.append("Done\n");
		}

		@Override
		protected void onProgressUpdate(Integer... values) {
		}
		
	}

	@Override
	protected void onNewIntent(Intent i) {
		Log.i(TAG,"onNewIntent action="+i.getAction()+", data="+i.getData());
	}

	@Override
	protected void onStart() {
		// TODO Auto-generated method stub
		super.onStart();
	}

	@Override
	protected void onStop() {
		// TODO Auto-generated method stub
		super.onStop();
	}

	@Override
	protected void onDestroy() {
		// TODO Auto-generated method stub
		super.onDestroy();
		if (task!=null) {
			Log.d(TAG,"Cancel unzip task on destroy");
			
			if (task.cancel(true)) {
				Toast.makeText(this, "Warning: config may be corrupt", Toast.LENGTH_LONG).show();
			}
		}
	}

}
