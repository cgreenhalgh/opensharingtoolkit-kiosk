/**
 * 
 */
package org.opensharingtoolkit.kiosk;

import java.util.LinkedList;
import java.util.List;

import android.accessibilityservice.AccessibilityService;
import android.app.Service;
import android.content.Context;
import android.graphics.PixelFormat;
import android.util.Log;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.View.OnTouchListener;
import android.view.ViewGroup.LayoutParams;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;

/**
 * @author pszcmg
 *
 */
public class SoftKeys /*implements OnTouchListener*/ {
	private static final String TAG = "kiosk-softkeys";
	private boolean mEnabled = false;
	private AccessibilityService mService= null;
	private List<View> mViews = new LinkedList<View>();
	
	public SoftKeys() {		
	}

	public synchronized void enable(AccessibilityService service, boolean softhome, boolean softback) {
		if (!mEnabled) {
			mEnabled = true;
			mService = service;
			// TODO
			Log.d(TAG,"SoftKeys.enable");
			try {
				if (softback) {
					Button back = new Button(mService);
					back.setEnabled(true);
					//back.setText("<");
					LayoutParams backLP = new LayoutParams(48, LayoutParams.WRAP_CONTENT);
					back.setLayoutParams(backLP);
					back.setClickable(true);
					back.setAlpha(0.05f);

					back.setOnClickListener(new OnClickListener() {
						@Override
						public void onClick(View v) {
							Log.d(TAG,"Back!");
							mService.performGlobalAction(AccessibilityService.GLOBAL_ACTION_BACK);
						}
					});

					FrameLayout frame = new FrameLayout(mService);
					frame.addView(back);

					addView(frame, Gravity.TOP | Gravity.LEFT);
				}
				if (softhome) {

					Button home = new Button(mService);
					home.setEnabled(true);
					//home.setText("H");
					LayoutParams homeLP = new LayoutParams(48, LayoutParams.WRAP_CONTENT);
					home.setLayoutParams(homeLP);
					home.setClickable(true);
					home.setAlpha(0.05f);

					home.setOnClickListener(new OnClickListener() {
						@Override
						public void onClick(View v) {
							Log.d(TAG,"home!");
							mService.performGlobalAction(AccessibilityService.GLOBAL_ACTION_HOME);
						}
					});

					FrameLayout frame = new FrameLayout(mService);
					frame.addView(home);

					addView(frame, Gravity.BOTTOM | Gravity.LEFT);
				}
			}
			catch (Exception e) {
				Log.e(TAG,"error adding softkeys view: "+e, e);
			}
		}
	}
	private void addView(FrameLayout frame, int gravity) {
		// TODO Auto-generated method stub
		mViews.add(frame);
		//mView.setOnTouchListener(this);
		
		WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
			    //WindowManager.LayoutParams.TYPE_SYSTEM_OVERLAY,
                WindowManager.LayoutParams.TYPE_SYSTEM_ALERT,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
                WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH, 
                PixelFormat.TRANSLUCENT);
			 
		params.gravity = gravity;
		 
		WindowManager wm = (WindowManager) mService.getSystemService(Context.WINDOW_SERVICE);
		wm.addView(frame, params);
	}

	public synchronized void disable() {
		if (mEnabled) {
			mEnabled = false;
			// TODO
			Log.d(TAG,"SoftKeys.disable");
			try {
				if (mService!=null) {
					WindowManager wm = (WindowManager) mService.getSystemService(Context.WINDOW_SERVICE);
					View v;
					while((v=mViews.remove(0))!=null)
						wm.removeView(v);
				}
			}
			catch (Exception e) {
				Log.e(TAG,"error removing softkeys view: "+e, e);
			}
			mService = null;
		}
	}

	/*@Override
	public boolean onTouch(View v, MotionEvent event) {
		// TODO Auto-generated method stub
		switch (event.getAction()) {
		case MotionEvent.ACTION_OUTSIDE:
			// unfocus window
			Log.d(TAG,"onTouch outside");
			break;
		default:
			Log.d(TAG,"onTouch "+event.getAction());
		}				
		return false;
	}*/
}
