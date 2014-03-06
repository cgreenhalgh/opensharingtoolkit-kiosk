# Performance testing

Create some test files (bash):
```
for f in 0 1 3 10 30 100 300 1000 3000 10000
do
  dd if=/dev/zero of=f$f bs=1024 count=$f
done
```
Run some download tests:
```
./testsize.sh http://leaflets/f/f
./testsize.sh http://localhost:9294/testfiles/f
./testcon.sh http://localhost:9294/testfiles/f
```


R
```
sz = read.table("~/workspace/opensharingtoolkit-kiosk/performance/testsize.log",header=TRUE)
plot(sz[[1]],sz[[2]])
r<-lm(sz[[2]] ~ sz[[1]])
r
Coefficients:
(Intercept)      sz[[1]]  
  0.1452058    0.0004366  
```
2.2MB/second; overhead 145ms/request.

`testsize.log.20140306T150000`: Nexus 7, deb, android 4.4.2, build KOT49H; getHostAddress in critical; file; buffered output.


