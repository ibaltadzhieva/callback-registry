var expect = require('chai').expect;
nocache = function (module) {
    delete require.cache[require.resolve(module)];
    return require(module);
};

var Registry = nocache('../lib/index.js');
console.log(Registry)
describe('callback-registry', function (done) {

    it('should execute single callback', function (done) {
        var registry = Registry();
        registry.add('test', done);
        registry.execute('test');
    });

    it('should execute multiple callbacks', function (done) {
        var registry = Registry();
        var invoked = 0;
        var p = function () {
            invoked++;
            if (invoked == 3) {
                done();
            }
        };
        registry.add('test', p);
        registry.add('test', p);
        registry.add('test', p);
        registry.execute('test');
    });

    it('should not execute callbacks on different keys', function (done) {
        var registry = Registry();
        var invoked = 0;
        var p1 = function () {
            invoked++;
            if (invoked == 2) {
                done();
            }
        };
        var p2 = function () {
            done('should not be invoked');
        }
        registry.add('test1', p1);
        registry.add('test2', p2);
        registry.execute('test1');
        registry.execute('test1');
    });

    it('should be able to remove callback', function (done) {
        var registry = Registry();
        var removeCallback = registry.add('test', function () {
            console.log('!!! ERROR');
            done('should not be executed');
        });
        removeCallback('test');
        registry.execute('test');
        done();
    });

    it('should pass arguments', function (done) {
        var registry = Registry();
        registry.add('test', function (a, b, c) {
            console.log(arguments);
            if (a === 1 && b === '2' && c === 3) {
                done();
            } else {
                done('error - arguments not matching');
            }
        });
        registry.execute('test', 1, '2', 3);
    });

    it('should return arguments', function(){
        var registry = Registry();
        registry.add('test', function () {
            return {a:1};
        });
        registry.add('test', function () {
            return {a:2};
        });

        var result = registry.execute('test');
        expect(result[0]).to.be.an('object');
        expect(result[0].a).to.equal(1);
        expect(result[1]).to.be.an('object');
        expect(result[1].a).to.equal(2);
    });

    it('should return results from the callbacks in array', function(){
        var registry = Registry();
        registry.add('test', function () {
            return {a:1};
        });
        var unsubscribe2 = registry.add('test', function () {
            unsubscribe2();
            return {a:2};
        });

        var result = registry.execute('test');
        expect(result.length).to.equal(2);
        result = registry.execute('test');
        expect(result.length).to.equal(1);
    });

    it('should return empty array if no subscribers', function(){
        var registry = Registry();
        var result = registry.execute('test');
        expect(Array.isArray(result)).to.equal(true);
        expect(result.length).to.equal(0);
    });

    it('should return results from the callbacks even if some of the callbacks throw Error', function(){
        var registry = Registry();
        registry.add('test', function () {
           throw Error('test');
        });

        registry.add('test', function () {
            return 1;
        });

        var result = registry.execute('test');
        expect(Array.isArray(result)).to.equal(true);
        expect(result.length).to.equal(2);
        expect(result[0]).to.equal(undefined);
        expect(result[1]).to.equal(1);
    });

    it('bugfix (https://github.com/gdavidkov) - issue when unsubscribing with more than one callbacks per key', function() {
        var registry = Registry();

        var executions1 = 0;
        var executions2 = 0;

        var unsubscribe1 = registry.add('test', function () {
            unsubscribe1();
            executions1++;
        });

        var unsubscribe2 = registry.add('test', function () {
            unsubscribe2();
            executions2++;
        });

        registry.execute('test');
        registry.execute('test');
        registry.execute('test');

        expect(executions1).to.equal(1);
        expect(executions2).to.equal(1);
    });

    it('should remove all callbacks on clear', function(){
        var registry = Registry();
        registry.add('test', function () {
           throw Error('test');
        });

        registry.add('test', function () {
            throw Error('test');
        });

        registry.clear();
        var result = registry.execute('test');
    });


    it('after clear I can call remove and it should not fail', function(){
        var registry = Registry();
        var remove1 = registry.add('test', function () {
           throw Error('test');
        });

        var remove2 = registry.add('test', function () {
            throw Error('test');
        });

        registry.clear();
        var result = registry.execute('test');
        remove1();
        remove2();
    });
});
