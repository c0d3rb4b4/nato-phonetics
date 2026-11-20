package com.natophonetics.iconpreview;
import android.app.Activity;
import android.os.Bundle;
import android.graphics.*;
import android.graphics.drawable.*;
import android.view.View;

// Diagnostic UI only. Reads the real installed application's packaged icon.
public class IconPreview extends Activity {
 public void onCreate(Bundle state){super.onCreate(state);setContentView(new Preview());}
 class Preview extends View {
  final AdaptiveIconDrawable icon;
  Preview(){super(IconPreview.this);try{icon=(AdaptiveIconDrawable)getPackageManager().getApplicationIcon("com.natophonetics.app");}catch(Exception e){throw new RuntimeException(e);}}
  void text(Canvas c,String text,float x,float y,float size,int color){Paint p=new Paint(3);p.setTextSize(size);p.setColor(color);c.drawText(text,x,y,p);}
  protected void onDraw(Canvas c){
   c.drawColor(Color.rgb(245,247,250));c.translate(0,getRootWindowInsets().getInsets(android.view.WindowInsets.Type.systemBars()).top);float w=getWidth();text(c,"Installed NATO icon resources",24,60,30,Color.BLACK);
   text(c,"Native Canvas crop diagnostics",24,100,24,Color.DKGRAY);
   int size=(int)(w*.34f);
   for(int n=0;n<4;n++){
    int x=(int)(w*(n%2==0?.08f:.58f)),y=160+(n/2)*(size+160);boolean themed=n>=2,squircle=n%2==1;
    c.save();c.translate(x,y);Path mask=new Path();
    if(squircle){float s=size,r=s*.24f;mask.moveTo(r,0);mask.lineTo(s-r,0);mask.cubicTo(s,0,s,0,s,r);mask.lineTo(s,s-r);mask.cubicTo(s,s,s,s,s-r,s);mask.lineTo(r,s);mask.cubicTo(0,s,0,s,0,s-r);mask.lineTo(0,r);mask.cubicTo(0,0,0,0,r,0);mask.close();}
    else mask.addCircle(size/2f,size/2f,size/2f,Path.Direction.CW);
    c.clipPath(mask);
    int inset=size/4;
    if(themed){c.drawColor(Color.rgb(215,225,255));Drawable mono=icon.getMonochrome().mutate();mono.setTint(Color.rgb(45,65,110));mono.setBounds(-inset,-inset,size+inset,size+inset);mono.draw(c);}
    else {for(Drawable layer:new Drawable[]{icon.getBackground(),icon.getForeground()}){layer.setBounds(-inset,-inset,size+inset,size+inset);layer.draw(c);}}
    c.restore();text(c,(themed?"Themed ":"Color ")+(squircle?"squircle":"circle"),x,y+size+42,25,Color.BLACK);
   }
   text(c,"Package: com.natophonetics.app",24,2*(size+160)+160,23,Color.DKGRAY);
   text(c,"Foreground/background/monochrome",24,2*(size+160)+200,23,Color.DKGRAY);
   text(c,"Actual launcher captured separately",24,2*(size+160)+240,23,Color.DKGRAY);
  }
 }
}
