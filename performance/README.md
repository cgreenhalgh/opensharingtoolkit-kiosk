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

