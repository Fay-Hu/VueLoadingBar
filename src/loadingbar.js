/**
 * 自动给vue的请求添加loading框
 * Created by xinchao.dou on 2016/10/27.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global.VueLoadingBar = factory());
})(this, (function () {
    'use strict';
    var requestCount = 0;// 请求数量
    var delayTimeoutId = 0;
    var loadingEle = document.createElement('div');
    var loadingBarDelay = 300;
    var enable = true;

    /**
     * 隐藏loading框
     * @private
     */
    function _hideLoading() {
        if (requestCount <= 1) {
            window.clearTimeout(delayTimeoutId);
            loadingEle.classList.remove('show');
        }
        requestCount--;
        requestCount = requestCount < 0 ? 0 : requestCount;
    }

    /**
     * 延迟显示loading框
     * @private
     */
    function _showLoading() {
        if (!enable)return false;
        if (requestCount === 0) {
            delayTimeoutId = setTimeout(function () {
                loadingEle.classList.add('show');
            }, loadingBarDelay); // 延迟显示，当请求响应时间过快时不需要显示loading
        }
        requestCount++;
    }

    /**
     * 初始化loading框、添加loadingBarDelay属性
     * @param Vue
     * @constructor
     */
    function LoadingBar(Vue) {
        Object.defineProperties(Vue.prototype, {
            loadingBarDelay: {
                get: function () {
                    return loadingBarDelay;
                },
                set: function (_loadingBarDelay) {
                    loadingBarDelay = Number(_loadingBarDelay);
                }
            },
            enableLoadingBar: {
                get: function () {
                    return enable;
                },
                set: function (enableLoadingBar) {
                    enable = Boolean(enableLoadingBar);
                }
            }
        });
        if (!document.getElementById('LoadingBar')) {
            loadingEle.id = 'LoadingBar';
            loadingEle.innerHTML = '<div class="loading-content">' +
                '<icon class="loading-icon"></icon></div>';
            document.body.appendChild(loadingEle);
        }
        /**
         * 判断使用的是vue-resource还是axios
         */
        if (Vue.http) {
            // vue-resource
            Vue.http.interceptors.push(function (request, next) {
                if (!request.$hideLoadingBar) {
                    _showLoading();
                    next(_hideLoading);
                }
            });
        } else if (Vue.axios || Vue.$axios || axios) {
            // axios 支持不绑定到Vue属性上或者绑定为Vue.axios、Vue.$axios
            var _axios = Vue.axios || Vue.$axios || axios;
            _axios.interceptors.request.use(function (request) {
                !request.$hideLoadingBar && _showLoading();
                return request;
            }, function (err) {
                // bug?：如果页面同时有启用loading和禁用loading的时候，禁用loading的请求出错会影响到启用loading的请求；但是不需要处理，因为同一个页面同时出现这种情况时本身就是错误
                _hideLoading();
                return Promise.reject(err);
            });
            _axios.interceptors.response.use(function (response) {
                //Tip: 如果其他的interceptors处理了返回数据，此处有可能会获取不到$hideLoadingBar，做一下处理。如果获取不到则默认隐藏loading
                response.config = response.config || {};
                !response.config.$hideLoadingBar && _hideLoading();
                return response;
            }, function (err) {
                // bug?：如果页面同时有启用loading和禁用loading的时候，禁用loading的请求出错会影响到启用loading的请求；但是不需要处理，因为同一个页面同时出现这种情况时本身就是错误
                _hideLoading();
                return Promise.reject(err);
            });
        } else {
            console.error('only vue-resource or axios support');
        }
    }

    if (typeof window !== 'undefined' && window.Vue) {
        window.Vue.use(LoadingBar);
    }
    return LoadingBar;
}));
